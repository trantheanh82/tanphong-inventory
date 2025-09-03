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
The DOT number is always a 4-digit number. It is often located inside an oval shape on the tire's sidewall.
Analyze the image and return the 4-digit number you find.
Return your answer as a JSON object with a single key "dotNumber".
Example: {"dotNumber": "4020"}

Image to analyze: {{media url=photoDataUri}}`,
    });

    const { output } = await recognizeDotPrompt({ photoDataUri });

    if (output && output.dotNumber && /^\d{4}$/.test(output.dotNumber)) {
      return output.dotNumber;
    }

    // Fallback for cases where structured output might fail.
    const llmResponse = await ai.generate({
      prompt: `Find the 4-digit DOT number in this image of a tire. The number is often in an oval. Respond with only the 4-digit number. If you cannot find one, respond with "none". Image: ${photoDataUri}`,
    });

    const textResponse = llmResponse.text.trim();
    if (/^\d{4}$/.test(textResponse)) {
      return textResponse;
    }

    return undefined;
  } catch (error) {
    console.error('Error in recognizeDotNumber flow:', error);
    return undefined;
  }
}
