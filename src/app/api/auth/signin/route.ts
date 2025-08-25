
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        const apiResponse = await fetch(`${process.env.API_ENDPOINT}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            return NextResponse.json(
                { message: responseData.message || 'Login failed from external API.' },
                { status: apiResponse.status }
            );
        }

        const response = NextResponse.json({
            success: true,
            message: 'Login successful.',
            data: responseData,
        });

        const cookieHeader = apiResponse.headers.get('set-cookie');
        if (cookieHeader) {
            // This is a simplified way to transfer the cookie.
            // In a real-world scenario, you might need to parse and reconstruct the cookie attributes.
            response.headers.set('set-cookie', cookieHeader);
        } else {
            console.warn('No set-cookie header found in the external API response.');
        }

        return response;

    } catch (error) {
        console.error('Error in signin route:', error);
        return NextResponse.json(
            { message: 'An internal server error occurred.' },
            { status: 500 }
        );
    }
}
