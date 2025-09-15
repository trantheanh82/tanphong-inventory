
'use server';
/**
 * @fileOverview An AI flow for recognizing tire information (DOT and/or Series) from an image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TireInfoRecognitionSchema = z.object({
  dotNumber: z
    .string()
    .optional()
    .describe('The 4-digit DOT number found in the image, if visible.'),
  seriesNumber: z
    .string()
    .optional()
    .describe('The alphanumeric series number found in the image, if visible.'),
});

export type TireInfo = z.infer<typeof TireInfoRecognitionSchema>;

export async function recognizeTireInfo(
  photoDataUri: string
): Promise<TireInfo | undefined> {
  try {
    const recognizeTireInfoPrompt = ai.definePrompt({
      name: 'recognizeTireInfoPrompt',
      input: { schema: z.object({ photoDataUri: z.string() }) },
      output: { schema: TireInfoRecognitionSchema },
      prompt: `You are an expert tire inspector. Your task is to identify the 4-digit DOT number and/or the alphanumeric series number from the provided image of a tire.
- The DOT number is always a 4-digit number, often inside an oval.
- The series number is alphanumeric.
Analyze the image and return any information you find. If you find both, return both. If you find only one, return only that one.
Return your answer as a JSON object.

Examples:
{"dotNumber": "4020", "seriesNumber": "A1B2C3D4"}
{"dotNumber": "3321"}
{"seriesNumber": "X9Y8Z7W6"}

Image to analyze: {{media url=photoDataUri}}`,
    });

    const { output } = await recognizeTireInfoPrompt({ photoDataUri });

    if (output && (output.dotNumber || output.seriesNumber)) {
      return {
          dotNumber: output.dotNumber,
          seriesNumber: output.seriesNumber,
      };
    }
    
    return undefined;
  } catch (error) {
    console.error('Error in recognizeTireInfo flow:', error);
    return undefined;
  }
}
