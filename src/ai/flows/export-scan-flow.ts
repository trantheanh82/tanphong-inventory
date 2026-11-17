'use server';
/**
 * @fileOverview OCR flow for recognizing tire information (DOT and/or Series) from an image using DeepSeek OCR.
 */

import { z } from 'zod';
import { recognizeTireInfoWithDeepSeek } from '@/lib/deepseek-ocr';

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
  return recognizeTireInfoWithDeepSeek(photoDataUri);
}
