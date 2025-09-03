'use server';
/**
 * @fileOverview An AI flow for recognizing a series number from an image of a tire.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SeriesRecognitionSchema = z.object({
  seriesNumber: z
    .string()
    .describe('The alphanumeric series number found in the image.'),
});

export async function recognizeSeriesNumber(
  photoDataUri: string
): Promise<string | undefined> {
  try {
    const recognizeSeriesPrompt = ai.definePrompt({
      name: 'recognizeSeriesPrompt',
      input: { schema: z.object({ photoDataUri: z.string() }) },
      output: { schema: SeriesRecognitionSchema },
      prompt: `You are an expert tire inspector. Your task is to identify the alphanumeric series number from the provided image of a tire.
The series number can contain letters and numbers.
Analyze the image and return the series number you find.
Return your answer as a JSON object with a single key "seriesNumber".
Example: {"seriesNumber": "A1B2C3D4"}

Image to analyze: {{media url=photoDataUri}}`,
    });

    const llmResponse = await recognizeSeriesPrompt({ photoDataUri });

    const seriesNumber = llmResponse.output?.seriesNumber;

    if (seriesNumber && seriesNumber.length > 0) {
      return seriesNumber.trim();
    }
    
    return undefined;
  } catch (error) {
    console.error('Error in recognizeSeriesNumber flow:', error);
    return undefined;
  }
}
