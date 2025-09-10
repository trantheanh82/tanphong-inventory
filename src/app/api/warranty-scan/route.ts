'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { recognizeSeriesNumber } from '@/ai/flows/warranty-scan-flow';

const { API_ENDPOINT, EXPORT_DETAIL_TBL_ID, WARRANTY_DETAIL_TBL_ID } = process.env;

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
    
    // Handle cases where the response might not have a body
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

export async function POST(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const { noteId, imageDataUri, seriesNumber: manualSeriesNumber } = await request.json();

    if (!noteId || (!imageDataUri && !manualSeriesNumber)) {
        return NextResponse.json({ message: 'Missing required parameters (noteId and either image or manual series).' }, { status: 400 });
    }
    
    if (!WARRANTY_DETAIL_TBL_ID) {
        return NextResponse.json({ message: 'Warranty tables are not configured.' }, { status: 500 });
    }

    let seriesNumber: string | undefined = manualSeriesNumber;
    
    // Step 1: Recognize Series Number from image if provided
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
        // Step 2: Validate the series by searching in export details
        const exportDetailRecord = await searchRecordBySeries(seriesNumber, cookieHeader);
        if (!exportDetailRecord) {
            return NextResponse.json({ success: false, message: `Không tìm thấy lốp xe đã bán với series: ${seriesNumber}` }, { status: 404 });
        }
        
        // Step 3: Check if this series has already been claimed for this warranty note
        const filterObject = {
            conjunction: 'and',
            filterSet: [
                { fieldId: 'warranty_note', operator: 'is', value: noteId },
                { fieldId: 'series', operator: 'is', value: seriesNumber }
            ],
        };
        const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
        const checkUrl = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record?filter=${filterQuery}&fieldKeyType=dbFieldName&take=1`;
        const existingClaimResponse = await apiRequest(checkUrl, 'GET', cookieHeader);
        if (existingClaimResponse.records?.length > 0) {
            return NextResponse.json({ success: false, message: `Series ${seriesNumber} đã được thêm vào phiếu bảo hành này.` }, { status: 409 });
        }


        // Step 4: Create Warranty Detail Record
        const createDetailPayload = {
            records: [{
                fields: {
                    warranty_note: { id: noteId },
                    series: seriesNumber,
                    dot: exportDetailRecord.fields.dot,
                    quantity: 1, // Always 1 for a warranty claim
                }
            }],
            fieldKeyType: "dbFieldName"
        };
        const createDetailUrl = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record`;
        await apiRequest(createDetailUrl, 'POST', cookieHeader, createDetailPayload);

        return NextResponse.json({
            success: true,
            message: `Đã ghi nhận lốp với series ${seriesNumber}.`,
            series: seriesNumber,
            dot: exportDetailRecord.fields.dot,
        });
    } catch (error: any) {
        console.error('Error processing warranty scan:', error);
        const message = error.message || 'An internal server error occurred.';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
