
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
      prompt: `You are an expert tire inspector. Your task is to identify the 4-digit DOT number and/or the alphanumeric series number from the provided image.
- The DOT number is always a 4-digit number. The first two digits MUST be a valid week (01-52). If it is not a valid week (e.g., '7021'), do not return it.
- The series number is a long alphanumeric string, often found printed on a sticker, sometimes below a barcode. It can be purely numeric.
- Analyze the image carefully. Extract the series number and/or the DOT number.
- In the provided image, the number below the barcode is the Series Number.

Examples of valid responses:
{"dotNumber": "4020", "seriesNumber": "A1B2C3D4"}
{"dotNumber": "3321"}
{"seriesNumber": "5052018182"}
{}

Image to analyze: {{media url=photoDataUri}}`,
    });

    const { output } = await recognizeTireInfoPrompt({ photoDataUri });
    
    if (output && (output.dotNumber || output.seriesNumber)) {
      return output;
    }
    
    return undefined;
  } catch (error) {
    console.error('Error in recognizeTireInfo flow:', error);
    return undefined;
  }
}
