
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const { currentPassword, newPassword } = await request.json();
        const cookieHeader = cookies().toString();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ message: 'Current and new passwords are required.' }, { status: 400 });
        }

        const apiResponse = await fetch(`${process.env.API_ENDPOINT}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieHeader
            },
            body: JSON.stringify({ oldPassword: currentPassword, newPassword: newPassword }),
        });

        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            return NextResponse.json(
                { message: responseData.message || 'Failed to change password.' },
                { status: apiResponse.status }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully.',
        });

    } catch (error) {
        console.error('Error in change-password route:', error);
        return NextResponse.json(
            { message: 'An internal server error occurred.' },
            { status: 500 }
        );
    }
}
