
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function fetchTableData(tableId: string, cookieHeader: string | null, take: number = 5) {
    const url = new URL(`${process.env.API_ENDPOINT}/table/${tableId}/record`);
    url.searchParams.append('take', take.toString());
    url.searchParams.append('fieldKeyType', 'dbFieldName');
    
    const orderBy = JSON.stringify([{ fieldId: 'createdAt', order: 'desc' }]);
    url.searchParams.append('orderBy', orderBy);

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
    }

    try {
        const response = await fetch(url.toString(), { method: 'GET', headers });
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

async function fetchWarrantyDetailsCount(noteId: string, cookieHeader: string | null): Promise<number> {
    const { API_ENDPOINT, WARRANTY_DETAIL_TBL_ID } = process.env;
    if (!API_ENDPOINT || !WARRANTY_DETAIL_TBL_ID) return 0;
    
    const filterObject = {
        conjunction: 'and',
        filterSet: [
            { fieldId: 'warranty_note', operator: 'is', value: noteId },
            { fieldId: 'series', operator: 'isNot', value: null }
        ],
    };
    const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
    const url = `${API_ENDPOINT}/table/${WARRANTY_DETAIL_TBL_ID}/record?filter=${filterQuery}&fieldKeyType=dbFieldName`;
    
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
    }

    try {
        const response = await fetch(url.toString(), { method: 'GET', headers });
        if (!response.ok) return 0;
        const data = await response.json();
        return data.records?.length || 0;
    } catch (error) {
        return 0;
    }
}


export async function GET(request: NextRequest) {
    const cookieHeader = cookies().toString();
    
    const { IMPORT_TBL_ID, EXPORT_TBL_ID, WARRANTY_TBL_ID } = process.env;

    if (!IMPORT_TBL_ID || !EXPORT_TBL_ID || !WARRANTY_TBL_ID) {
        return NextResponse.json({ message: 'Table IDs are not configured in the environment.' }, { status: 500 });
    }

    try {
        const [imports, exports, rawWarranties] = await Promise.all([
            fetchTableData(IMPORT_TBL_ID, cookieHeader, 3),
            fetchTableData(EXPORT_TBL_ID, cookieHeader, 3),
            fetchTableData(WARRANTY_TBL_ID, cookieHeader, 3)
        ]);

        const warranties = await Promise.all(rawWarranties.map(async (warranty: any) => {
            const scannedCount = await fetchWarrantyDetailsCount(warranty.id, cookieHeader);
            return {
                ...warranty,
                fields: {
                    ...warranty.fields,
                    scanned: scannedCount,
                }
            };
        }));
        
        return NextResponse.json({ imports, exports, warranties });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
