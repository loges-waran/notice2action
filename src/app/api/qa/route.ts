import { NextResponse } from 'next/server';
import { answerDocumentQuestion } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentText, question, chatHistory, useMock } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    if (!documentText || !documentText.trim()) {
      return NextResponse.json({ error: 'Document text is required to answer questions' }, { status: 400 });
    }

    // Explicit demo mode only
    if (useMock) {
      const qLower = question.toLowerCase();
      let mockAnswer = "Based on the provided notice document:\n";

      if (qLower.includes('deadline') || qLower.includes('date') || qLower.includes('when')) {
        mockAnswer += "• The primary deadline for initial response and document submittal is **September 15, 2026**.\n• A formal review hearing request must be filed by **October 01, 2026**.";
      } else if (qLower.includes('penalty') || qLower.includes('fine') || qLower.includes('consequence') || qLower.includes('warn')) {
        mockAnswer += "• Failing to respond by September 15, 2026 results in an immediate **15% statutory non-compliance penalty interest fee** and disallowance of $12,400 in deductions.";
      } else if (qLower.includes('document') || qLower.includes('form') || qLower.includes('need') || qLower.includes('submit')) {
        mockAnswer += "• Required documents include:\n 1. Form 1040 (2025 Tax Return Copy)\n 2. Schedule C Expense Receipts (> $500)\n 3. Bank Statements (Jan 2025 - Dec 2025)\n 4. Proof of Identification & Notice Copy";
      } else {
        mockAnswer += `This document relates to tax verification and compliance. For "${question}", please check the summary or deadlines tab for specific instructions outlined by the issuing authority.`;
      }

      return NextResponse.json({ answer: mockAnswer, source: 'mock' });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key missing in environment variables.' },
        { status: 500 }
      );
    }

    const answer = await answerDocumentQuestion(documentText, question, chatHistory || []);
    return NextResponse.json({ answer, source: 'ai' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Failed to generate answer';
    console.error('Q&A Error:', error);
    return NextResponse.json(
      { error: errMessage },
      { status: 500 }
    );
  }
}
