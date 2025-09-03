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
  const llmResponse = await ai.generate({
    model: 'googleai/gemini-1.5-flash-latest',
    prompt: `From the provided image, identify any 4-digit number. This is a DOT number from a tire. Respond with JSON containing the key "dotNumber" and the 4-digit number as the value. If no 4-digit number is found, return an empty string for the value. Example: {"dotNumber": "4020"}. Image: {{media url=imageDataUri}}`,
    output: {
      schema: z.object({
          dotNumber: z.string().describe("The 4-digit number found in the image."),
      })
    },
    // Adding a config to enforce JSON output
    config: {
        responseMimeType: "application/json",
    }
  });
  
  const output = llmResponse.output();
  
  // Validate the output to ensure it's a 4-digit number.
  if (!output || !output.dotNumber || !/^\d{4}$/.test(output.dotNumber)) {
    return { dotNumber: undefined };
  }

  return { dotNumber: output.dotNumber };
}
