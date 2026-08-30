import { NextResponse } from 'next/server';
import { parseNoticeText } from '@/lib/ai';
import { sampleNoticeData } from '@/types/notice';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, useMock } = body;

    // Demo mode
    if (useMock) {
      return NextResponse.json({
        data: sampleNoticeData,
        source: 'mock',
      });
    }

    // Make sure text exists
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No notice text provided' },
        { status: 400 }
      );
    }

    // Check Gemini API key
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Gemini API Key missing in environment variables. Please set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY.',
        },
        { status: 500 }
      );
    }

    // Send extracted text to Gemini
    const data = await parseNoticeText(text);

    return NextResponse.json({
      data,
      source: 'ai',
    });
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error
        ? error.message
        : 'Failed to analyze notice';

    console.error('Analysis error:', error);

    return NextResponse.json(
      { error: errMessage },
      { status: 500 }
    );
  }
}