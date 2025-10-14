'use server';

import { NextRequest, NextResponse } from 'next/server';
import { recognizeTireInfo } from '@/ai/flows/export-scan-flow';

/**
 * This endpoint is for recognition only. It does not update any database records.
 * It takes an image and returns what it recognizes (DOT and/or Series).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageDataUri } = body;

    if (!imageDataUri) {
      return NextResponse.json({ success: false, message: 'Missing imageDataUri' }, { status: 400 });
    }

    const recognizedInfo = await recognizeTireInfo(imageDataUri);

    if (!recognizedInfo || (!recognizedInfo.dotNumber && !recognizedInfo.seriesNumber)) {
      return NextResponse.json({ success: false, message: 'Could not recognize any tire information.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      dotNumber: recognizedInfo.dotNumber,
      seriesNumber: recognizedInfo.seriesNumber,
    });

  } catch (error: any) {
    console.error('Error in recognition-only endpoint:', error);
    return NextResponse.json({ success: false, message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
