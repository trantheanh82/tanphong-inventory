
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function fetchTableData(tableId: string, cookieHeader: string | null) {
    const url = `${process.env.API_ENDPOINT}/table/${tableId}/record?fieldKeyType=dbFieldName`;
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
    }

    try {
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error fetching data for table ${tableId}:`, errorText);
            throw new Error(`Failed to fetch data for table ${tableId}`);
        }
        const data = await response.json();
        return data.records || [];
    } catch (error) {
        console.error(`Exception when fetching table ${tableId}:`, error);
        return [];
    }
}

export async function GET(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    
    const { IMPORT_TBL_ID, EXPORT_TBL_ID, QUARANTINE_TBL_ID } = process.env;

    let tableId: string | undefined;

    switch (type) {
        case 'import':
            tableId = IMPORT_TBL_ID;
            break;
        case 'export':
            tableId = EXPORT_TBL_ID;
            break;
        case 'warranty':
            tableId = QUARANTINE_TBL_ID;
            break;
        default:
            return NextResponse.json({ message: 'Invalid type specified.' }, { status: 400 });
    }

    if (!tableId) {
        return NextResponse.json({ message: 'Table ID for the specified type is not configured.' }, { status: 500 });
    }

    try {
        const data = await fetchTableData(tableId, cookieHeader);
        return NextResponse.json(data);

    } catch (error) {
        console.error(`Error fetching ${type} data:`, error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
