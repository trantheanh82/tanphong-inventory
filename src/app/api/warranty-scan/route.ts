
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { recognizeSeriesNumber } from '@/ai/flows/warranty-scan-flow';

const { API_ENDPOINT, EXPORT_DETAIL_TBL_ID, WARRANTY_DETAIL_TBL_ID, WARRANTY_TBL_ID } = process.env;

async function apiRequest(url: string, method: string, cookieHeader: string | null, body?: any) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
            errorMessage = await response.text();
        }
        console.error(`API Error from ${method} ${url}: ${errorMessage}`);
        throw new Error(errorMessage);
    }
    
    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : {};
}

async function searchRecordBySeries(series: string, cookieHeader: string | null) {
    if (!API_ENDPOINT || !EXPORT_DETAIL_TBL_ID) {
        throw new Error('Environment variables for API endpoint and table IDs are not set.');
    }
    
    const url = new URL(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`);
    url.searchParams.append('fieldKeyType', 'dbFieldName');
    url.searchParams.append('search[]', series);
    url.searchParams.append('search[]', 'series');
    url.searchParams.append('search[]', 'true');
    url.searchParams.append('take', '1');
    
    const response = await apiRequest(url.toString(), 'GET', cookieHeader);
    return response.records?.[0];
}

async function findEmptyWarrantyDetail(noteId: string, cookieHeader: string | null) {
    const filterObject = {
        conjunction: 'and',
        filterSet: [
            { fieldId: 'warranty_note', operator: 'is', value: noteId },
            { fieldId: 'series', operator: 'is', value: null } // Find a record where series is not yet set
        ],
    };
    const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
    const url = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record?filter=${filterQuery}&fieldKeyType=dbFieldName&take=1`;
    const response = await apiRequest(url, 'GET', cookieHeader);
    return response.records?.[0];
}

async function countFilledWarrantyDetails(noteId: string, cookieHeader: string | null): Promise<number> {
    const filterObject = {
        conjunction: 'and',
        filterSet: [
            { fieldId: 'warranty_note', operator: 'is', value: noteId },
            { fieldId: 'series', operator: 'isNot', value: null }
        ],
    };
    const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
    const countUrl = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record/count?filter=${filterQuery}`;
    const response = await apiRequest(countUrl, 'GET', cookieHeader);
    return response.count || 0;
}

async function countTotalWarrantyDetails(noteId: string, cookieHeader: string | null): Promise<number> {
    const filterObject = {
        conjunction: 'and',
        filterSet: [{ fieldId: 'warranty_note', operator: 'is', value: noteId }],
    };
    const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
    const countUrl = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record/count?filter=${filterQuery}`;
    const response = await apiRequest(countUrl, 'GET', cookieHeader);
    return response.count || 0;
}


export async function POST(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const { noteId, imageDataUri, seriesNumber: manualSeriesNumber } = await request.json();

    if (!noteId || (!imageDataUri && !manualSeriesNumber)) {
        return NextResponse.json({ message: 'Missing required parameters (noteId and either image or manual series).' }, { status: 400 });
    }
    
    if (!WARRANTY_DETAIL_TBL_ID || !WARRANTY_TBL_ID) {
        return NextResponse.json({ message: 'Warranty tables are not configured.' }, { status: 500 });
    }

    let seriesNumber: string | undefined = manualSeriesNumber;
    
    if (imageDataUri) {
        try {
            seriesNumber = await recognizeSeriesNumber(imageDataUri);
            if (!seriesNumber) {
                 return NextResponse.json({ success: false, message: "Không nhận dạng được series. Vui lòng thử lại hoặc nhập tay." }, { status: 400 });
            }
        } catch (aiError) {
            console.error("AI recognition error in warranty scan:", aiError);
            return NextResponse.json({ success: false, message: 'AI processing failed. Please try again.' }, { status: 500 });
        }
    }
    
    if (!seriesNumber) {
        return NextResponse.json({ success: false, message: "Không có số series để xử lý." }, { status: 400 });
    }

    try {
        const emptyDetailRecord = await findEmptyWarrantyDetail(noteId, cookieHeader);

        if (!emptyDetailRecord) {
            return NextResponse.json({ success: false, message: `Đã quét đủ số lượng cho phiếu bảo hành này.` }, { status: 400 });
        }

        const exportDetailRecord = await searchRecordBySeries(seriesNumber, cookieHeader);
        if (!exportDetailRecord) {
            return NextResponse.json({ success: false, message: `Không tìm thấy lốp xe đã bán với series: ${seriesNumber}` }, { status: 404 });
        }
        
        const filterObject = {
            conjunction: 'and',
            filterSet: [
                { fieldId: 'series', operator: 'is', value: seriesNumber }
            ],
        };
        const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
        const checkUrl = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record?filter=${filterQuery}&fieldKeyType=dbFieldName&take=1`;
        const existingClaimResponse = await apiRequest(checkUrl, 'GET', cookieHeader);
        if (existingClaimResponse.records?.length > 0) {
            return NextResponse.json({ success: false, message: `Series ${seriesNumber} đã được bảo hành.` }, { status: 409 });
        }

        const updatePayload = {
            records: [{
                id: emptyDetailRecord.id,
                fields: {
                    series: seriesNumber,
                    dot: exportDetailRecord.fields.dot,
                }
            }],
            fieldKeyType: "dbFieldName"
        };
        const updateDetailUrl = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record`;
        await apiRequest(updateDetailUrl, 'PATCH', cookieHeader, updatePayload);
        
        const newScannedCount = await countFilledWarrantyDetails(noteId, cookieHeader);
        const totalQuantity = await countTotalWarrantyDetails(noteId, cookieHeader);

        if (newScannedCount >= totalQuantity) {
            const updateNotePayload = {
                records: [{ id: noteId, fields: { status: 'Đã scan đủ' } }],
                fieldKeyType: "dbFieldName",
            };
            await apiRequest(`${API_ENDPOINT}/table/${WARRANTY_TBL_ID}/record`, 'PATCH', cookieHeader, updateNotePayload);
        }

        return NextResponse.json({
            success: true,
            message: `Đã ghi nhận lốp với series ${seriesNumber}. (${newScannedCount}/${totalQuantity})`,
            series: seriesNumber,
            dot: exportDetailRecord.fields.dot,
            updatedRecordId: emptyDetailRecord.id
        });
    } catch (error: any) {
        console.error('Error processing warranty scan:', error);
        const message = error.message || 'An internal server error occurred.';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
