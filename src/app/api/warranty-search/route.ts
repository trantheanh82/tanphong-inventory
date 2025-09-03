'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { recognizeSeriesNumber } from '@/ai/flows/warranty-scan-flow';

const API_ENDPOINT = process.env.API_ENDPOINT;
const EXPORT_DETAIL_TBL_ID = process.env.EXPORT_DETAIL_TBL_ID;

async function searchRecordBySeries(series: string, cookieHeader: string | null) {
    if (!API_ENDPOINT || !EXPORT_DETAIL_TBL_ID) {
        throw new Error('Environment variables for API endpoint and table IDs are not set.');
    }
    
    const url = new URL(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`);
    url.searchParams.append('fieldKeyType', 'dbFieldName');
    url.searchParams.append('search[]', series);
    url.searchParams.append('search[]', 'series');
    url.searchParams.append('search[]', 'true');
    
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
            errorMessage = await response.text();
        }
        console.error(`API Error searching series: ${errorMessage}`);
        throw new Error(errorMessage);
    }
    
    return response.json();
}

export async function POST(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const { imageDataUri } = await request.json();

    if (!imageDataUri) {
        return NextResponse.json({ message: 'Missing image data.' }, { status: 400 });
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

        // Assuming the first record is the correct one
        const record = searchResult.records[0];

        return NextResponse.json({
            success: true,
            message: `Tìm thấy lốp xe với series: ${seriesNumber}`,
            record: record,
        });

    } catch (error: any) {
        console.error('Error searching for warranty item:', error);
        const message = error.message || 'An internal server error occurred.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
