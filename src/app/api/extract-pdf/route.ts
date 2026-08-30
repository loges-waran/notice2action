import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';

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

    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      return NextResponse.json(
        { error: 'Please upload a PDF file.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // PDF.js is intentionally configured to continue past
    // recoverable PDF errors such as malformed XRef entries.
    const pdf = await getDocumentProxy(data, {
      stopAtErrors: false,
      isEvalSupported: false,
    });

    const result = await extractText(pdf, {
      mergePages: true,
    });

    const text =
      typeof result.text === 'string'
        ? result.text
        : String(result.text ?? '');

    if (!text.trim()) {
      return NextResponse.json(
        {
          error:
            'Could not extract text from this PDF. The document may be scanned, image-only, encrypted, or corrupted.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: text.trim(),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to parse PDF';

    console.error('PDF extraction error:', error);

    return NextResponse.json(
      {
        error: `PDF extraction failed: ${message}`,
      },
      { status: 500 }
    );
  }
}