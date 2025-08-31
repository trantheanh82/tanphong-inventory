
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const cookie = cookieStore.get('auth_session');

        const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
        
        // Invalidate the cookie by setting its max-age to 0
        if (cookie) {
            response.cookies.set({
                name: 'auth_session',
                value: '',
                httpOnly: true,
                path: '/',
                maxAge: 0,
            });
        }

        return response;

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
