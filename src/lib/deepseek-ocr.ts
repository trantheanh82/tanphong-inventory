import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export interface DeepSeekOcrResponse {
  id?: string;
  object?: string;
  created?: number;
  purpose?: string;
  page_count?: number;
  pages?: Array<{
    index: number;
    text: string;
    finish_reason?: string;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
    type?: string;
  };
}

export interface ExtractedTireData {
  dotNumber?: string;
  seriesNumber?: string;
  rawText?: string;
}

/**
 * Calls DeepSeek OCR API to extract text from a photo Data URI.
 */
export async function callDeepSeekOcr(photoDataUri: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_OCR_KEY;
  const endpoint =
    process.env.DEEPSEEK_API_ENDPOIN ||
    process.env.DEEPSEEK_API_ENDPOINT ||
    'https://api.deepseek.com/v1/tools/ocr';

  if (!apiKey) {
    throw new Error('DEEPSEEK_OCR_KEY is not defined in environment variables.');
  }

  // Extract base64 image data
  const base64Match = photoDataUri.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
  let imageType = 'jpeg';
  let base64Data = photoDataUri;

  if (base64Match) {
    imageType = base64Match[1] === 'png' ? 'png' : 'jpeg';
    base64Data = base64Match[2];
  } else if (photoDataUri.includes(';base64,')) {
    base64Data = photoDataUri.split(';base64,')[1];
  }

  const buffer = Buffer.from(base64Data, 'base64');
  const blob = new Blob([buffer], { type: `image/${imageType}` });

  const formData = new FormData();
  formData.append('purpose', 'text_recognition');
  formData.append('file', blob, `tire_scan.${imageType === 'png' ? 'png' : 'jpg'}`);

  console.log(`[DeepSeek OCR] Sending request to ${endpoint} (${buffer.length} bytes)...`);

  const response = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    },
    20000
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[DeepSeek OCR] Request failed with status ${response.status}: ${errorBody}`);
    throw new Error(`DeepSeek OCR failed (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as DeepSeekOcrResponse;

  if (data.pages && Array.isArray(data.pages)) {
    const fullText = data.pages
      .map((p) => p.text || '')
      .join('\n')
      .trim();
    console.log('[DeepSeek OCR] Recognized text:', fullText || '(empty)');
    return fullText;
  }

  return '';
}

/**
 * Parses raw OCR text to extract DOT (4 digits, valid week) and Series (up to 11 chars, no 'O').
 */
export function extractTireDataFromOcrText(ocrText: string): ExtractedTireData {
  if (!ocrText || typeof ocrText !== 'string') {
    return { dotNumber: undefined, seriesNumber: undefined, rawText: '' };
  }

  // Clean markdown headings, bullets, extra spaces
  const cleanText = ocrText
    .replace(/[#*`_~|]/g, ' ')
    .replace(/[–—]/g, '-')
    .trim();

  let dotNumber: string | undefined = undefined;
  let seriesNumber: string | undefined = undefined;

  // 1. Look for explicit DOT mentions: e.g. "DOT: 4020", "DOT 1234 5678 4020", "DOT ... 4020"
  const dotExplicitRegex = /DOT\b[^0-9\n]*([A-Z0-9\s-]*\b(\d{4})\b)/i;
  const explicitMatch = cleanText.match(dotExplicitRegex);
  if (explicitMatch) {
    const fourDigitMatches = explicitMatch[0].match(/\b\d{4}\b/g);
    if (fourDigitMatches && fourDigitMatches.length > 0) {
      for (let i = fourDigitMatches.length - 1; i >= 0; i--) {
        const candidate = fourDigitMatches[i];
        const week = parseInt(candidate.substring(0, 2), 10);
        if (week >= 1 && week <= 52) {
          dotNumber = candidate;
          break;
        }
      }
    }
  }

  // If no explicit DOT match, search for numbers in parentheses e.g. (4020)
  if (!dotNumber) {
    const parenMatch = cleanText.match(/\((\d{4})\)/);
    if (parenMatch) {
      const candidate = parenMatch[1];
      const week = parseInt(candidate.substring(0, 2), 10);
      if (week >= 1 && week <= 52) {
        dotNumber = candidate;
      }
    }
  }

  // Fallback: search for any standalone 4-digit number where week is 01-52
  if (!dotNumber) {
    const allFourDigits = cleanText.match(/\b\d{4}\b/g) || [];
    for (const candidate of allFourDigits) {
      const week = parseInt(candidate.substring(0, 2), 10);
      if (week >= 1 && week <= 52) {
        dotNumber = candidate;
        break;
      }
    }
  }

  // 2. Look for Series Number
  // Priority: explicit "Series:", "Series Number:", "S/N:"
  const seriesExplicitRegex =
    /(?:Series|Serie|Seri|S\/N|SN|Serial)\s*(?:Number|No)?[:\s]+([A-Z0-9]{4,11})\b/i;
  const seriesExplicitMatch = cleanText.match(seriesExplicitRegex);
  if (seriesExplicitMatch) {
    seriesNumber = seriesExplicitMatch[1].toUpperCase().replace(/O/g, '0');
  }

  if (!seriesNumber) {
    // Look for standalone tokens (usually 4-11 alphanumeric characters)
    const ignoredWords = new Set([
      'TIRE', 'TIRES', 'DOT', 'MADE', 'IN', 'VIETNAM', 'CHINA', 'THAILAND', 'JAPAN',
      'RADIAL', 'TUBELESS', 'STEEL', 'BELTED', 'MAX', 'LOAD', 'PSI', 'KPA', 'COLD',
      'STANDARD', 'CERTIFICATE', 'INSPECTION', 'RENDER', 'NUMBER', 'SERIES', 'BRAND',
      'BRIDGESTONE', 'MICHELIN', 'GOODYEAR', 'YOKOHAMA', 'DUNLOP', 'CONTINENTAL',
      'MAXXIS', 'HANKOOK', 'KUMHO', 'OTANI', 'CASUMINA', 'DRC', 'SRC'
    ]);

    const tokens = cleanText
      .split(/[\s,;:()\\[\]{}]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 4 && t.length <= 11);

    for (const token of tokens) {
      const upperToken = token.toUpperCase();
      if (ignoredWords.has(upperToken)) continue;
      if (token === dotNumber) continue;

      // Must contain at least one digit or alphanumeric format
      if (/\d/.test(token) && /^[A-Za-z0-9]{4,11}$/.test(token)) {
        if (/^\d{4}$/.test(token) && token === dotNumber) continue;
        seriesNumber = token.toUpperCase().replace(/O/g, '0');
        break;
      }
    }
  }

  return { dotNumber, seriesNumber, rawText: cleanText };
}

/**
 * Scan DOT Number using DeepSeek OCR.
 */
export async function recognizeDotNumberWithDeepSeek(
  photoDataUri: string
): Promise<string | undefined> {
  try {
    const ocrText = await callDeepSeekOcr(photoDataUri);
    const { dotNumber } = extractTireDataFromOcrText(ocrText);
    return dotNumber;
  } catch (error) {
    console.error('[DeepSeek OCR] Error recognizing DOT:', error);
    return undefined;
  }
}

/**
 * Scan Series Number using DeepSeek OCR.
 */
export async function recognizeSeriesNumberWithDeepSeek(
  photoDataUri: string
): Promise<string | undefined> {
  try {
    const ocrText = await callDeepSeekOcr(photoDataUri);
    const { seriesNumber } = extractTireDataFromOcrText(ocrText);
    return seriesNumber;
  } catch (error) {
    console.error('[DeepSeek OCR] Error recognizing Series:', error);
    return undefined;
  }
}

/**
 * Scan both DOT and Series numbers using DeepSeek OCR.
 */
export async function recognizeTireInfoWithDeepSeek(
  photoDataUri: string
): Promise<{ dotNumber?: string; seriesNumber?: string } | undefined> {
  try {
    const ocrText = await callDeepSeekOcr(photoDataUri);
    const { dotNumber, seriesNumber } = extractTireDataFromOcrText(ocrText);
    if (!dotNumber && !seriesNumber) {
      return undefined;
    }
    return { dotNumber, seriesNumber };
  } catch (error) {
    console.error('[DeepSeek OCR] Error recognizing Tire Info:', error);
    return undefined;
  }
}
