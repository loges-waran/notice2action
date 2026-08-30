import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Please upload a PDF file.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await pdfParse(buffer);
    const text = result.text || '';

    if (!text.trim()) {
      return NextResponse.json(
        {
          error:
            'Could not extract text from PDF. The document might be scanned or image-only.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: text.trim(),
    });
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error
        ? error.message
        : 'Failed to parse PDF';

    console.error('PDF parsing error:', error);

    return NextResponse.json(
      { error: errMessage },
      { status: 500 }
    );
  }
}