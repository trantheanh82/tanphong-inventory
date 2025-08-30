
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function fetchTableData(tableId: string, cookieHeader: string | null, take: number = 5) {
    const url = `${process.env.API_ENDPOINT}/table/${tableId}/record?take=${take}&
fieldKeyType=dbFieldName`;
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
    
    const { IMPORT_TBL_ID, EXPORT_TBL_ID, WARRANTY_TBL_ID } = process.env;

    if (!IMPORT_TBL_ID || !EXPORT_TBL_ID || !WARRANTY_TBL_ID) {
        return NextResponse.json({ message: 'Table IDs are not configured in the environment.' }, { status: 500 });
    }

    try {
        const [imports, exports, warranties] = await Promise.all([
            fetchTableData(IMPORT_TBL_ID, cookieHeader, 5),
            fetchTableData(EXPORT_TBL_ID, cookieHeader, 5),
            fetchTableData(WARRANTY_TBL_ID, cookieHeader, 5)
        ]);
        
        return NextResponse.json({ imports, exports, warranties });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
