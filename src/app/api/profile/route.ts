
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const { EMPLOYEE_TBL_ID, API_ENDPOINT } = process.env;

    if (!EMPLOYEE_TBL_ID || !API_ENDPOINT) {
        return NextResponse.json({ message: 'Employee table ID or API endpoint is not configured.' }, { status: 500 });
    }

    // The signin process should store the user ID in the session,
    // but the current auth flow is a simple proxy. We will assume for now
    // the backend can identify the user via the session cookie.
    // A robust solution would be to get user ID from a decoded JWT.
    // For this implementation, we will fetch the first employee record associated with the user session.
    // A more specific filter would be needed in a multi-user system.

    const url = new URL(`${API_ENDPOINT}/table/${EMPLOYEE_TBL_ID}/record`);
    url.searchParams.append('fieldKeyType', 'dbFieldName');
    url.searchParams.append('take', '1'); // Assuming one employee record per user

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
            console.error(`Error fetching data for table ${EMPLOYEE_TBL_ID}:`, errorText);
            throw new Error(`Failed to fetch data for table ${EMPLOYEE_TBL_ID}`);
        }
        const data = await response.json();
        
        if (data.records && data.records.length > 0) {
            return NextResponse.json(data.records[0]);
        } else {
            return NextResponse.json({ message: 'No employee record found for the current user.' }, { status: 404 });
        }
        
    } catch (error) {
        console.error(`Exception when fetching employee table:`, error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
