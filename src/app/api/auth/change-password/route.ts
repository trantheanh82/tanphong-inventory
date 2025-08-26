
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PATCH(request: NextRequest) {
    try {
        const { currentPassword, newPassword } = await request.json();
        const cookieHeader = cookies().toString();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ message: 'Current and new passwords are required.' }, { status: 400 });
        }

        const apiResponse = await fetch(`${process.env.API_ENDPOINT}/auth/change-password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieHeader
            },
            body: JSON.stringify({ password: currentPassword, newPassword: newPassword }),
        });

        let responseData;
        const responseText = await apiResponse.text();
        try {
            responseData = JSON.parse(responseText);
        } catch (error) {
            responseData = { message: responseText };
        }


        if (!apiResponse.ok) {
            const errorMessage = responseData.message || 'Failed to change password from external API.';
            return NextResponse.json(
                { message: errorMessage },
                { status: apiResponse.status }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully.',
        });

    } catch (error: any) {
        console.error('Error in change-password route:', error);
        const message = error.message || 'An internal server error occurred.';
        return NextResponse.json(
            { message },
            { status: 500 }
        );
    }
}
