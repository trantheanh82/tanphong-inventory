
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_ENDPOINT = process.env.API_ENDPOINT;
const EXPORT_TBL_ID = process.env.EXPORT_TBL_ID;
const EXPORT_DETAIL_TBL_ID = process.env.EXPORT_DETAIL_TBL_ID;

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
    if (!API_ENDPOINT || !EXPORT_TBL_ID || !EXPORT_DETAIL_TBL_ID) {
        return NextResponse.json({ message: 'Environment variables for API endpoint and table IDs are not set.' }, { status: 500 });
    }

    const cookieHeader = cookies().toString();

    try {
        const { name, items } = await request.json();

        if (!name || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
        }

        // 1. Create Export Note
        const createNotePayload = {
            records: [{ fields: { name: name } }]
        };
        const createNoteUrl = `${API_ENDPOINT}/table/${EXPORT_TBL_ID}/record`;
        
        const noteResponse = await apiRequest(createNoteUrl, 'POST', createNotePayload, cookieHeader);
        
        const noteRecord = noteResponse.records?.[0];
        if (!noteRecord || !noteRecord.id) {
            throw new Error('Failed to create export note or get its ID.');
        }
        const exportNoteId = noteRecord.id;

        // 2. Create Export Note Details
        const detailRecords = items.map((item: any) => ({
            fields: {
                export_note: { id: exportNoteId },
                DOT: parseInt(item.dot, 10),
                quantity: item.quantity,
                tire_type: item.type,
                ...(item.series && { series: item.series })
            }
        }));

        const createDetailsPayload = { records: detailRecords };
        const createDetailsUrl = `${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`;

        await apiRequest(createDetailsUrl, 'POST', createDetailsPayload, cookieHeader);

        // 3. Return success with the export note ID
        return NextResponse.json({ success: true, exportNoteId: exportNoteId }, { status: 200 });

    } catch (error: any) {
        console.error('Error creating export note:', error);
        const message = error.message || 'An internal server error occurred.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
