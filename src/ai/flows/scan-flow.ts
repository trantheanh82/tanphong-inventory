
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
Analyze the image. If you find a 4-digit number, return it.
Return your answer as a JSON object with a single key "dotNumber".
Example: {"dotNumber": "4020"}

Image to analyze: {{media url=photoDataUri}}`,
    });

    const { output } = await recognizeDotPrompt({ photoDataUri });

    if (output && output.dotNumber && /^\d{4}$/.test(output.dotNumber)) {
      // Validate the week number in code, not in the prompt, for better reliability.
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
