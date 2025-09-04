
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { recognizeSeriesNumber } from '@/ai/flows/warranty-scan-flow';

const API_ENDPOINT = process.env.API_ENDPOINT;
const EXPORT_DETAIL_TBL_ID = process.env.EXPORT_DETAIL_TBL_ID;
const WARRANTY_TBL_ID = process.env.WARRANTY_TBL_ID;
const WARRANTY_DETAIL_TBL_ID = process.env.WARRANTY_DETAIL_TBL_ID;

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

    return response.json();
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
    
    return apiRequest(url.toString(), 'GET', cookieHeader);
}

export async function POST(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const { imageDataUri } = await request.json();

    if (!imageDataUri) {
        return NextResponse.json({ message: 'Missing image data.' }, { status: 400 });
    }
    if (!WARRANTY_TBL_ID || !WARRANTY_DETAIL_TBL_ID) {
        return NextResponse.json({ message: 'Warranty tables are not configured in the environment.' }, { status: 500 });
    }

    let seriesNumber: string | undefined;
    try {
        seriesNumber = await recognizeSeriesNumber(imageDataUri);
    } catch (aiError) {
        console.error("AI recognition error:", aiError);
        return NextResponse.json({ success: false, message: 'AI processing failed. Please try again.' }, { status: 500 });
    }
    
    if (!seriesNumber) {
        return NextResponse.json({ success: false, message: "Không nhận dạng được series. Vui lòng thử lại." }, { status: 400 });
    }

    try {
        const searchResult = await searchRecordBySeries(seriesNumber, cookieHeader);

        if (!searchResult.records || searchResult.records.length === 0) {
            return NextResponse.json({ success: false, message: `Không tìm thấy lốp xe với series: ${seriesNumber}` }, { status: 404 });
        }

        const exportDetailRecord = searchResult.records[0];

        // 1. Create Warranty Note
        const createNotePayload = {
            records: [{ fields: { name: `Bảo hành lốp ${seriesNumber}` } }],
            fieldKeyType: "dbFieldName"
        };
        const createNoteUrl = `${API_ENDPOINT}/table/${WARRANTY_TBL_ID}/record`;
        const noteResponse = await apiRequest(createNoteUrl, 'POST', cookieHeader, createNotePayload);
        const noteRecord = noteResponse.records?.[0];
        if (!noteRecord || !noteRecord.id) {
            throw new Error('Failed to create warranty note or get its ID.');
        }
        const warrantyNoteId = noteRecord.id;

        // 2. Create Warranty Note Detail
        const detailRecord = {
            fields: {
                warranty_note: { id: warrantyNoteId },
                series: seriesNumber,
                dot: exportDetailRecord.fields.dot,
                quantity: 1, // Defaulting to 1 for a warranty claim
            }
        };

        const createDetailsPayload = { 
            records: [detailRecord],
            fieldKeyType: "dbFieldName" // This was the missing piece
        };
        const createDetailsUrl = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record`;
        await apiRequest(createDetailsUrl, 'POST', cookieHeader, createDetailsPayload);
        
        return NextResponse.json({
            success: true,
            message: `Tạo phiếu bảo hành thành công cho lốp xe với series: ${seriesNumber}`,
            warrantyNoteId: warrantyNoteId,
        });

    } catch (error: any) {
        console.error('Error processing warranty claim:', error);
        const message = error.message || 'An internal server error occurred.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
