
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_ENDPOINT = process.env.API_ENDPOINT;
const IMPORT_TBL_ID = process.env.IMPORT_TBL_ID;
const IMPORT_DETAIL_TBL_ID = process.env.IMPORT_DETAIL_TBL_ID;

async function apiRequest(url: string, method: string, body: any, cookieHeader: string | null) {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
            errorMessage = await response.text();
        }
        console.error(`API Error: ${errorMessage}`);
        throw new Error(errorMessage);
    }

    return response.json();
}

export async function POST(request: NextRequest) {
    if (!API_ENDPOINT || !IMPORT_TBL_ID || !IMPORT_DETAIL_TBL_ID) {
        return NextResponse.json({ message: 'Environment variables for API endpoint and table IDs are not set.' }, { status: 500 });
    }

    const cookieHeader = cookies().toString();

    try {
        const { importId, items } = await request.json();

        if (!importId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
        }

        // 1. Create Import Note
        const createNotePayload = {
            records: [{ fields: { name: importId } }],
            fieldKeyType: "dbFieldName"
        };
        const createNoteUrl = `${API_ENDPOINT}/table/${IMPORT_TBL_ID}/record`;
        
        const noteResponse = await apiRequest(createNoteUrl, 'POST', createNotePayload, cookieHeader);
        
        const noteRecord = noteResponse.records?.[0];
        if (!noteRecord || !noteRecord.id) {
            throw new Error('Failed to create import note or get its ID.');
        }
        const importNoteId = noteRecord.id;

        // 2. Create Import Note Details
        const detailRecords = items.map((item: any) => ({
            fields: {
                import_note: { id: importNoteId },
                DOT: parseInt(item.dot, 10),
                quantity: item.quantity,
            }
        }));

        const createDetailsPayload = { 
            records: detailRecords,
            fieldKeyType: "dbFieldName"
        };
        const createDetailsUrl = `${API_ENDPOINT}/table/${IMPORT_DETAIL_TBL_ID}/record`;

        await apiRequest(createDetailsUrl, 'POST', createDetailsPayload, cookieHeader);

        // 3. Return success with the import note ID
        return NextResponse.json({ success: true, importNoteId: importNoteId }, { status: 200 });

    } catch (error: any) {
        console.error('Error creating import note:', error);
        const message = error.message || 'An internal server error occurred.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
