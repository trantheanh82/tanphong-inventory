
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_ENDPOINT = process.env.API_ENDPOINT;
const EXPORT_DETAIL_TBL_ID = process.env.EXPORT_DETAIL_TBL_ID;
const WARRANTY_TBL_ID = process.env.WARRANTY_TBL_ID;
const WARRANTY_DETAIL_TBL_ID = process.env.WARRANTY_DETAIL_TBL_ID;

type WarrantyItem = {
    series: string;
};

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
    url.searchParams.append('take', '1');
    
    const response = await apiRequest(url.toString(), 'GET', cookieHeader);
    return response.records?.[0];
}

export async function POST(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const { name, items } = await request.json();

    if (!name || !items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ message: 'Invalid request body. Name and items array are required.' }, { status: 400 });
    }
    
    if (!WARRANTY_TBL_ID || !WARRANTY_DETAIL_TBL_ID) {
        return NextResponse.json({ message: 'Warranty tables are not configured in the environment.' }, { status: 500 });
    }

    try {
        // 1. Create Warranty Note
        const createNotePayload = {
            records: [{ fields: { name: name } }],
            fieldKeyType: "dbFieldName"
        };
        const createNoteUrl = `${API_ENDPOINT}/table/${WARRANTY_TBL_ID}/record`;
        const noteResponse = await apiRequest(createNoteUrl, 'POST', cookieHeader, createNotePayload);
        const noteRecord = noteResponse.records?.[0];
        if (!noteRecord || !noteRecord.id) {
            throw new Error('Failed to create warranty note or get its ID.');
        }
        const warrantyNoteId = noteRecord.id;

        // 2. Process each item
        const detailRecords = await Promise.all(items.map(async (item: WarrantyItem) => {
            const exportDetailRecord = await searchRecordBySeries(item.series, cookieHeader);

            if (!exportDetailRecord) {
                // We'll throw an error that will be caught by the main try-catch block
                throw new Error(`Không tìm thấy lốp xe với series: ${item.series}`);
            }

            return {
                fields: {
                    warranty_note: { id: warrantyNoteId },
                    series: item.series,
                    dot: exportDetailRecord.fields.dot,
                    quantity: 1, // Defaulting to 1 for a warranty claim
                }
            };
        }));
        
        // 3. Create Warranty Note Details in bulk
        const createDetailsPayload = { 
            records: detailRecords,
            fieldKeyType: "dbFieldName"
        };
        const createDetailsUrl = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record`;
        await apiRequest(createDetailsUrl, 'POST', cookieHeader, createDetailsPayload);
        
        return NextResponse.json({
            success: true,
            message: `Tạo phiếu bảo hành "${name}" thành công với ${items.length} lốp xe.`,
            warrantyNoteId: warrantyNoteId,
        });

    } catch (error: any) {
        console.error('Error processing warranty claim:', error);
        const message = error.message || 'An internal server error occurred.';
        // Ensure the error message from the child promise is passed up
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
