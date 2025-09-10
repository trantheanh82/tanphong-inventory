
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_ENDPOINT = process.env.API_ENDPOINT;
const WARRANTY_TBL_ID = process.env.WARRANTY_TBL_ID;

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
    
    if (!WARRANTY_TBL_ID) {
        return NextResponse.json({ message: 'Warranty table is not configured in the environment.' }, { status: 500 });
    }

    try {
        // Create Warranty Note with a total quantity, but no details yet.
        const createNotePayload = {
            records: [{ 
                fields: { 
                    name: name,
                    total_warranty_note: quantity // Using this field to store expected quantity
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
