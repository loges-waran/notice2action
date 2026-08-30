import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);

    // Ensure worker is available on globalThis for pdfjs-dist / pdf-parse in Node runtime
    if (typeof globalThis !== 'undefined') {
      // @ts-expect-error pdfjs-dist worker lacks strict typescript declarations
      const workerModule = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
      (globalThis as Record<string, unknown>).pdfjsWorker = workerModule;
    }

    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: uint8Array });
    const result = await parser.getText();
    await parser.destroy();

    const text = result.text || '';

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. The document might be scanned or image-only.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Failed to parse PDF';
    console.error('PDF parsing error:', error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
