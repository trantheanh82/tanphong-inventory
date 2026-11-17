'use server';
/**
 * @fileOverview OCR flow for recognizing a series number from an image of a tire using DeepSeek OCR.
 */

import { recognizeSeriesNumberWithDeepSeek } from '@/lib/deepseek-ocr';

export async function recognizeSeriesNumber(
  photoDataUri: string
): Promise<string | undefined> {
  return recognizeSeriesNumberWithDeepSeek(photoDataUri);
}
