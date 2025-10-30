
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
    .describe('The 4-digit DOT number found in the image, if visible. This is often inside an oval shape.'),
  seriesNumber: z
    .string()
    .max(11, 'Series number cannot be longer than 11 characters.')
    .optional()
    .describe('The alphanumeric series number found in the image, if visible and no longer than 11 characters.'),
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
- The DOT number is always a 4-digit number, often located inside an oval shape.
- The series number is a long alphanumeric string, often found printed on a sticker, and it MUST be 11 characters or less. The number below a barcode is the Series Number.
- IMPORTANT: The series number never contains the letter 'O'. If you see a character that looks like 'O', it is always the number '0'. Convert it accordingly.
- Analyze the image carefully. Extract the series number (max 11 chars) and/or the 4-digit DOT number. If you can only find one, return only that one.

Examples of valid responses:
{"dotNumber": "4020", "seriesNumber": "A1B2C3D4E5F"}
{"dotNumber": "3321"}
{"seriesNumber": "5052018182"}
{}

Image to analyze: {{media url=photoDataUri}}`,
    });

    const { output } = await recognizeTireInfoPrompt({ photoDataUri });
    
    if (output) {
      // Post-processing and validation in code is more reliable than in the prompt.
      if (output.dotNumber) {
        if (!/^\d{4}$/.test(output.dotNumber)) {
          output.dotNumber = undefined; // Not a 4-digit number
        } else {
          const week = parseInt(output.dotNumber.substring(0, 2), 10);
          if (week < 1 || week > 52) {
            output.dotNumber = undefined; // Invalid week
          }
        }
      }

      if (output.seriesNumber) {
        // Replace all occurrences of 'O' with '0' as a fallback.
        output.seriesNumber = output.seriesNumber.replace(/O/g, '0');
        if (output.seriesNumber.length > 11) {
          // AI might hallucinate despite instructions, so we double-check.
          output.seriesNumber = undefined;
        }
      }

      if (output.dotNumber || output.seriesNumber) {
        return output;
      }
    }
    
    return undefined;
  } catch (error) {
    console.error('Error in recognizeTireInfo flow:', error);
    return undefined;
  }
}
