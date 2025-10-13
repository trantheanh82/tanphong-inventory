
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
    .describe('The 4-digit DOT number found in the image, if visible and valid. The first two digits must be between 01-52.'),
  seriesNumber: z
    .string()
    .max(10, 'Series number cannot be longer than 10 characters.')
    .optional()
    .describe('The alphanumeric series number found in the image, if visible and no longer than 10 characters.'),
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
      prompt: `You are an expert tire inspector. Your task is to identify the 4-digit DOT number and/or the alphanumeric series number from the provided image.
- The DOT number is always a 4-digit number. The first two digits MUST be a valid week (01-52). If it is not a valid week (e.g., '7021'), do not return it.
- The series number is a long alphanumeric string, often found printed on a sticker, and it MUST be 10 characters or less. The number below a barcode is the Series Number.
- IMPORTANT: The series number never contains the letter 'O'. If you see a character that looks like 'O', it is always the number '0'. Convert it accordingly.
- Analyze the image carefully. Extract the series number (max 10 chars) and/or the DOT number. If you can only find one, return only that one.

Examples of valid responses:
{"dotNumber": "4020", "seriesNumber": "A1B2C3D4"}
{"dotNumber": "3321"}
{"seriesNumber": "5052018182"}
{}

Image to analyze: {{media url=photoDataUri}}`,
    });

    const { output } = await recognizeTireInfoPrompt({ photoDataUri });
    
    if (output) {
      if (output.seriesNumber) {
        // Replace all occurrences of 'O' with '0' as a fallback.
        output.seriesNumber = output.seriesNumber.replace(/O/g, '0');
      }

      if (output.dotNumber || output.seriesNumber) {
        if (output.seriesNumber && output.seriesNumber.length > 10) {
          // AI might hallucinate despite instructions, so we double-check.
          output.seriesNumber = undefined;
        }
        return output;
      }
    }
    
    return undefined;
  } catch (error) {
    console.error('Error in recognizeTireInfo flow:', error);
    return undefined;
  }
}
