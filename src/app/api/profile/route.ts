
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const { EMPLOYEE_TBL_ID, API_ENDPOINT } = process.env;

    if (!EMPLOYEE_TBL_ID || !API_ENDPOINT) {
        return NextResponse.json({ message: 'Employee table ID or API endpoint is not configured.' }, { status: 500 });
    }

    // The backend can identify the user via the session cookie.
    // This API call will fetch the employee record linked to the current session user.
    // We fetch just one record, assuming a one-to-one mapping between a user and an employee profile.
    const url = new URL(`${API_ENDPOINT}/table/${EMPLOYEE_TBL_ID}/record`);
    url.searchParams.append('fieldKeyType', 'dbFieldName');
    url.searchParams.append('take', '1'); 

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
