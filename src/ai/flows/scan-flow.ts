'use server';
/**
 * @fileOverview OCR flow for recognizing a 4-digit DOT number from an image of a tire using DeepSeek OCR.
 */

import { recognizeDotNumberWithDeepSeek } from '@/lib/deepseek-ocr';

export async function recognizeDotNumber(
  photoDataUri: string
): Promise<string | undefined> {
  return recognizeDotNumberWithDeepSeek(photoDataUri);
}
