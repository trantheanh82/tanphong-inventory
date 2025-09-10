
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_ENDPOINT = process.env.API_ENDPOINT;
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


export async function POST(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const { name, quantity } = await request.json();

    if (!name || !quantity || quantity < 1) {
        return NextResponse.json({ message: 'Invalid request body. Name and a positive quantity are required.' }, { status: 400 });
    }
    
    if (!WARRANTY_TBL_ID || !WARRANTY_DETAIL_TBL_ID) {
        return NextResponse.json({ message: 'Warranty tables are not configured in the environment.' }, { status: 500 });
    }

    try {
        // 1. Create the parent Warranty Note
        const createNotePayload = {
            records: [{ 
                fields: { 
                    name: name
                } 
            }],
            fieldKeyType: "dbFieldName"
        };
        const createNoteUrl = `${API_ENDPOINT}/table/${WARRANTY_TBL_ID}/record`;
        const noteResponse = await apiRequest(createNoteUrl, 'POST', cookieHeader, createNotePayload);
        
        const noteRecord = noteResponse.records?.[0];
        if (!noteRecord || !noteRecord.id) {
            throw new Error('Failed to create warranty note or get its ID.');
        }
        const warrantyNoteId = noteRecord.id;

        // 2. Create the child Warranty Note Detail records
        const detailRecords = Array.from({ length: quantity }, () => ({
            fields: {
                warranty_note: { id: warrantyNoteId },
                quantity: 1
            }
        }));

        const createDetailsPayload = { 
            records: detailRecords,
            fieldKeyType: "dbFieldName"
        };
        const createDetailsUrl = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record`;

        await apiRequest(createDetailsUrl, 'POST', createDetailsPayload, cookieHeader);

        
        return NextResponse.json({
            success: true,
            message: `Tạo phiếu bảo hành "${name}" thành công. Sẵn sàng để quét.`,
            warrantyNoteId: warrantyNoteId,
        });

    } catch (error: any) {
        console.error('Error creating warranty note:', error);
        const message = error.message || 'An internal server error occurred.';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
