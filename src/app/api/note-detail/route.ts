
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_ENDPOINT = process.env.API_ENDPOINT;

async function fetchNoteDetails(tableId: string, noteId: string, filterField: string, cookieHeader: string | null) {
    const filterObject = {
        conjunction: 'and',
        filterSet: [
            {
                fieldId: filterField,
                operator: 'isExactly',
                value: [noteId],
            },
        ],
    };

    const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
    const url = `${API_ENDPOINT}/table/${tableId}/record?filter=${filterQuery}&fieldKeyType=dbFieldName`;

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
    let filterField: string | undefined;

    switch (type) {
        case 'import':
            tableId = IMPORT_DETAIL_TBL_ID;
            filterField = 'import_note';
            break;
        case 'export':
            tableId = EXPORT_DETAIL_TBL_ID;
            filterField = 'export_note';
            break;
        case 'warranty':
            tableId = WARRANTY_DETAIL_TBL_ID;
            filterField = 'warranty_note';
            break;
        default:
            return NextResponse.json({ message: 'Invalid type specified.' }, { status: 400 });
    }

    if (!tableId || !filterField) {
        return NextResponse.json({ message: `Table ID or filter field for type '${type}' is not configured.` }, { status: 500 });
    }

    try {
        const details = await fetchNoteDetails(tableId, noteId, filterField, cookieHeader);
        return NextResponse.json(details);
    } catch (error) {
        console.error(`Error fetching details for note ${noteId}:`, error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}

