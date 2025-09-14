
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
    
    const filterObject = {
        conjunction: 'and',
        filterSet: [
            { fieldId: 'series', operator: 'contains', value: series }
        ],
    };
    const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
    const url = `${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record?filter=${filterQuery}&fieldKeyType=dbFieldName`;
    
    const response = await apiRequest(url, 'GET', cookieHeader);
    
    if (!response.records || response.records.length === 0) {
        return undefined;
    }

    // Since 'contains' can have partial matches, we must verify the full series number.
    for (const record of response.records) {
        if (record.fields && record.fields.series) {
            const seriesList = record.fields.series.split(',').map((s: string) => s.trim());
            if (seriesList.includes(series)) {
                return record; // Return the first record with an exact match
            }
        }
    }
    
    return undefined;
}

async function findEmptyWarrantyDetail(noteId: string, cookieHeader: string | null) {
    const filterObject = {
        conjunction: 'and',
        filterSet: [
            { fieldId: 'warranty_note', operator: 'is', value: noteId },
            { fieldId: 'series', operator: 'isEmpty', value: null } // Find a record where series is not yet set
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
            { fieldId: 'warranty_note', operator: 'is', value: noteId }
        ],
    };
    const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
    const url = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record?filter=${filterQuery}&fieldKeyType=dbFieldName`;
    const response = await apiRequest(url, 'GET', cookieHeader);
    const records = response.records || [];
    return records.reduce((sum: number, record: any) => sum + (record.fields.scanned || 0), 0);
}

async function countTotalWarrantyDetails(noteId: string, cookieHeader: string | null): Promise<number> {
    const filterObject = {
        conjunction: 'and',
        filterSet: [{ fieldId: 'warranty_note', operator: 'is', value: noteId }],
    };
    const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
    const url = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record?filter=${filterQuery}&fieldKeyType=dbFieldName`;
    const response = await apiRequest(url, 'GET', cookieHeader);
    const records = await response.records || [];
    return records.length;
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
        // Rule 1: Check for duplicates within the current warranty note
        const currentNoteDetailsFilter = {
            conjunction: 'and',
            filterSet: [
                { fieldId: 'warranty_note', operator: 'is', value: noteId },
                { fieldId: 'series', operator: 'is', value: seriesNumber }
            ],
        };
        const currentNoteDetailsUrl = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record?filter=${encodeURIComponent(JSON.stringify(currentNoteDetailsFilter))}&fieldKeyType=dbFieldName&take=1`;
        const currentNoteDetailsResponse = await apiRequest(currentNoteDetailsUrl, 'GET', cookieHeader);
        if (currentNoteDetailsResponse.records?.length > 0) {
            return NextResponse.json({ success: false, message: `Series ${seriesNumber} đã được quét cho phiếu này.` }, { status: 409 });
        }

        // Rule 2: Check if series has been claimed in ANY warranty note (excluding current note context as it is handled above)
        const allClaimsFilter = {
            conjunction: 'and',
            filterSet: [{ fieldId: 'series', operator: 'is', value: seriesNumber }],
        };
        const allClaimsUrl = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record?filter=${encodeURIComponent(JSON.stringify(allClaimsFilter))}&fieldKeyType=dbFieldName&take=1`;
        const existingClaimResponse = await apiRequest(allClaimsUrl, 'GET', cookieHeader);
        if (existingClaimResponse.records?.length > 0) {
            return NextResponse.json({ success: false, message: `Series ${seriesNumber} đã được bảo hành.` }, { status: 409 });
        }
        
        // Rule 3: Find an empty slot in the current warranty note
        const emptyDetailRecord = await findEmptyWarrantyDetail(noteId, cookieHeader);
        if (!emptyDetailRecord) {
            return NextResponse.json({ success: true, warning: true, message: `Đã quét đủ số lượng cho phiếu bảo hành này.` }, { status: 200 });
        }

        // Rule 4: Validate the series exists in export records
        const exportDetailRecord = await searchRecordBySeries(seriesNumber, cookieHeader);
        if (!exportDetailRecord) {
            return NextResponse.json({ success: false, message: `Không tìm thấy series trên hệ thống: ${seriesNumber}` }, { status: 404 });
        }

        const updatePayload = {
            records: [{
                id: emptyDetailRecord.id,
                fields: {
                    series: seriesNumber,
                    dot: exportDetailRecord.fields.dot,
                    scanned: 1,
                    status: 'Đã scan',
                }
            }],
            fieldKeyType: "dbFieldName"
        };
        const updateDetailUrl = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record`;
        await apiRequest(updateDetailUrl, 'PATCH', cookieHeader, updatePayload);
        
        const newScannedCount = await countFilledWarrantyDetails(noteId, cookieHeader);
        const totalQuantity = await countTotalWarrantyDetails(noteId, cookieHeader);

        const isNoteCompleted = newScannedCount >= totalQuantity;

        if (isNoteCompleted) {
            const updateNotePayload = {
                records: [{ id: noteId, fields: { status: 'Đã scan đủ' } }],
                fieldKeyType: "dbFieldName",
            };
            await apiRequest(`${API_ENDPOINT}/table/${WARRANTY_TBL_ID}/record`, 'PATCH', cookieHeader, updateNotePayload);
        }

        return NextResponse.json({
            success: true,
            message: isNoteCompleted ? `Đã scan đủ. Ghi nhận lốp cuối cùng với series ${seriesNumber}.` : `Đã ghi nhận lốp với series ${seriesNumber}. (${newScannedCount}/${totalQuantity})`,
            series: seriesNumber,
            dot: exportDetailRecord.fields.dot,
            updatedRecordId: emptyDetailRecord.id,
            isCompleted: isNoteCompleted
        });
    } catch (error: any) {
        console.error('Error processing warranty scan:', error);
        const message = error.message || 'An internal server error occurred.';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}

    