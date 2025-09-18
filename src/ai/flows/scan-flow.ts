'use server';
/**
 * @fileOverview An AI flow for recognizing a 4-digit DOT number from an image of a tire.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// This schema is for internal use by the prompt, not for direct input/output of the flow.
const DotRecognitionSchema = z.object({
  dotNumber: z
    .string()
    .describe('The 4-digit DOT number found in the image.'),
});

export async function recognizeDotNumber(
  photoDataUri: string
): Promise<string | undefined> {
  try {
    const recognizeDotPrompt = ai.definePrompt({
      name: 'recognizeDotPrompt',
      input: { schema: z.object({ photoDataUri: z.string() }) },
      output: { schema: DotRecognitionSchema },
      prompt: `You are an expert tire inspector. Your task is to identify the 4-digit DOT number from the provided image of a tire.
The DOT number is always a 4-digit number, often located inside an oval shape.
The first two digits of the DOT number represent the week of manufacture and MUST be a number between 01 and 52.
The last two digits represent the year.
Analyze the image. If you find a valid 4-digit DOT number that meets this criteria, return it. Otherwise, do not return anything.
Return your answer as a JSON object with a single key "dotNumber".
Example of a valid DOT: {"dotNumber": "4020"} (40th week of 2020)
Example of an invalid number you should ignore: "7023" (because 70 is not a valid week)

Image to analyze: {{media url=photoDataUri}}`,
    });

    const { output } = await recognizeDotPrompt({ photoDataUri });

    if (output && output.dotNumber && /^\d{4}$/.test(output.dotNumber)) {
      const week = parseInt(output.dotNumber.substring(0, 2), 10);
      if (week >= 1 && week <= 52) {
        return output.dotNumber;
      }
    }
    
    return undefined;
  } catch (error) {
    console.error('Error in recognizeDotNumber flow:', error);
    return undefined;
  }
}
