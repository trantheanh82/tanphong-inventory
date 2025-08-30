
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_ENDPOINT = process.env.API_ENDPOINT;

async function fetchNoteDetails(tableId: string, noteId: string, cookieHeader: string | null) {
    // This assumes the backend can filter details by a link to the main note record.
    // The filter query parameter might look something like: `filter=export_note.id%3D'${noteId}'`
    // This needs to be adapted to the actual backend API filtering capabilities.
    // Using a generic search for now.
    const url = `${API_ENDPOINT}/table/${tableId}/record?filter=import_note.id%3D'${noteId}'&fieldKeyType=dbFieldName`;

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
    }

    try {
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error fetching details for note ${noteId} from table ${tableId}:`, errorText);
            throw new Error(`Failed to fetch details for note ${noteId}`);
        }
        const data = await response.json();
        return data.records || [];
    } catch (error) {
        console.error(`Exception when fetching details for note ${noteId}:`, error);
        return [];
    }
}

export async function GET(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const noteId = searchParams.get('noteId');

    if (!type || !noteId) {
        return NextResponse.json({ message: 'Type and Note ID are required.' }, { status: 400 });
    }

    const { IMPORT_DETAIL_TBL_ID, EXPORT_DETAIL_TBL_ID, WARRANTY_DETAIL_TBL_ID } = process.env;

    let tableId: string | undefined;
    switch (type) {
        case 'import':
            tableId = IMPORT_DETAIL_TBL_ID;
            break;
        case 'export':
            tableId = EXPORT_DETAIL_TBL_ID;
            break;
        case 'warranty':
            tableId = WARRANTY_DETAIL_TBL_ID;
            break;
        default:
            return NextResponse.json({ message: 'Invalid type specified.' }, { status: 400 });
    }

    if (!tableId) {
        return NextResponse.json({ message: `Table ID for type '${type}' is not configured.` }, { status: 500 });
    }

    try {
        const details = await fetchNoteDetails(tableId, noteId, cookieHeader);
        return NextResponse.json(details);
    } catch (error) {
        console.error(`Error fetching details for note ${noteId}:`, error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
