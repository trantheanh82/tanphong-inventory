'use server';
/**
 * @fileOverview Authentication flows.
 *
 * - login - A function to handle user login.
 * - LoginInput - The input type for the login function.
 * - LoginOutput - The return type for the login function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { cookies } from 'next/headers';

const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

const LoginOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
});
export type LoginOutput = z.infer<typeof LoginOutputSchema>;

export async function login(input: LoginInput): Promise<LoginOutput> {
  const loginFlow = ai.defineFlow(
    {
      name: 'loginFlow',
      inputSchema: LoginInputSchema,
      outputSchema: LoginOutputSchema,
    },
    async (input) => {
      try {
        const response = await fetch(`${process.env.API_ENDPOINT}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        const responseData = await response.json();

        if (!response.ok) {
          console.error('API login failed:', responseData);
          return {
            success: false,
            message: responseData.message || 'Login failed.',
          };
        }

        const cookieHeader = response.headers.get('set-cookie');
        if (cookieHeader) {
          // In a server action context, we can set the cookie
           cookies().set('auth_cookie', cookieHeader, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
           console.log('Cookie set from response header.');
        } else {
            console.warn('No set-cookie header found in login response.');
        }

        return {
          success: true,
          message: 'Login successful.',
          data: responseData,
        };
      } catch (error) {
        console.error('Error calling login API:', error);
        return {
          success: false,
          message: 'An error occurred during login.',
        };
      }
    }
  );
  return await loginFlow(input);
}
