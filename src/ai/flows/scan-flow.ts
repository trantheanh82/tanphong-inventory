'use server';
/**
 * @fileOverview An AI flow for recognizing a 4-digit DOT number from an image.
 *
 * - recognizeDotNumber - A function that takes an image and returns the identified number.
 * - RecognizeDotNumberInput - The input type for the function.
 * - RecognizeDotNumberOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const RecognizeDotNumberInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A cropped image of a tire, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeDotNumberInput = z.infer<typeof RecognizeDotNumberInputSchema>;

const RecognizeDotNumberOutputSchema = z.object({
  dotNumber: z.string().optional().describe('The 4-digit DOT number found in the image.'),
});
export type RecognizeDotNumberOutput = z.infer<typeof RecognizeDotNumberOutputSchema>;

export async function recognizeDotNumber(input: RecognizeDotNumberInput): Promise<RecognizeDotNumberOutput> {
  const recognizeDotFlow = ai.defineFlow(
    {
      name: 'recognizeDotFlow',
      inputSchema: RecognizeDotNumberInputSchema,
      outputSchema: RecognizeDotNumberOutputSchema,
    },
    async (input) => {
      const llmResponse = await ai.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        prompt: `You are an expert at reading text from images of tires. Your task is to find a 4-digit number in the provided image. This is a DOT number. Respond with only the 4-digit number. If no 4-digit number is found, respond with an empty string. Image: {{media url=imageDataUri}}`,
        output: {
          schema: z.object({
             dotNumber: z.string().describe("The 4-digit number found in the image."),
          })
        }
      });
      
      const output = llmResponse.output();
      if (!output || !output.dotNumber || !/^\d{4}$/.test(output.dotNumber)) {
        return { dotNumber: undefined };
      }

      return { dotNumber: output.dotNumber };
    }
  );

  return await recognizeDotFlow(input);
}
