import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { Notice2ActionData } from '@/types/notice';

// Configure AI SDK using environment variables only (GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY)
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

const google = createGoogleGenerativeAI({
  apiKey: apiKey || '',
});

const noticeSchema = z.object({
  summary: z.object({
    title: z.string(),
    issuer: z.string(),
    noticeNumber: z.string().optional(),
    issueDate: z.string().optional(),
    overallSummary: z.string(),
    keyPoints: z.array(z.string()),
  }),
  eligibility: z.array(
    z.object({
      criterion: z.string(),
      status: z.enum(['eligible', 'ineligible', 'action_required', 'unknown']),
      details: z.string(),
    })
  ),
  deadlines: z.array(
    z.object({
      title: z.string(),
      date: z.string(),
      timeRemaining: z.string().optional(),
      urgency: z.enum(['critical', 'upcoming', 'flexible']),
      description: z.string(),
    })
  ),
  documents: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      status: z.enum(['needed', 'ready', 'optional']),
      format: z.string().optional(),
    })
  ),
  checklist: z.array(
    z.object({
      id: z.string(),
      task: z.string(),
      owner: z.string().optional(),
      deadline: z.string().optional(),
      priority: z.enum(['high', 'medium', 'low']),
      category: z.enum(['document', 'payment', 'form', 'communication', 'other']),
      completed: z.boolean().optional(),
    })
  ),
  warnings: z.array(
    z.object({
      type: z.enum(['penalty', 'legal', 'deadline', 'financial', 'general']),
      severity: z.enum(['high', 'medium', 'low']),
      message: z.string(),
      consequence: z.string(),
    })
  ),
});

export async function parseNoticeText(text: string): Promise<Notice2ActionData> {
  if (!apiKey) {
    throw new Error('Gemini API Key missing in environment variables. Please set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY.');
  }

  const model = google('gemini-3.6-flash');

  const prompt = `You are a precise, document-driven information extraction system.
Analyze the following document text and extract structured information into the requested schema.

CRITICAL INSTRUCTIONS:
1. Extract content EXCLUSIVELY from the provided Document Text below.
2. DO NOT use hard-coded sample data, external facts, or assumed template values.
3. If specific information is NOT present in the document:
   - For issuer or notice number or issue date: Return "Not specified in the document." or leave optional string clear.
   - For summary key points: Include only key points explicitly stated in text. If none, return an empty array [].
   - For eligibility: If criteria are not present or information is insufficient, return an item with criterion: "Eligibility Status", status: "unknown", and details: "Not enough information in the document." or an empty array [].
   - For deadlines: Extract explicit or relative wording (e.g. "within 30 days") as date/description. Do not copy dates from other notices. If no deadlines exist, return an empty array [].
   - For required documents: List ONLY documents/materials actually requested or mentioned in the text. If none, return an empty array [].
   - For checklist: Generate action items ONLY from explicit requirements or instructions in the text. If none, return an empty array [].
   - For warnings: List warnings, penalties, or risks ONLY if explicitly stated in the text. Do not invent legal consequences or risks. If none, return an empty array [].
4. Preserve the document's original wording, numbers, relative timeframes, and structure as much as possible.
5. Handle any length or layout. Do not assume every document has standard notice sections.

Document Text:
"""
${text}
"""`;

  const { object } = await generateObject({
    model,
    schema: noticeSchema,
    prompt,
  });

  return object as Notice2ActionData;
}

export async function answerDocumentQuestion(
  documentText: string,
  question: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API Key missing in environment variables.');
  }

  const model = google('gemini-3.6-flash');

  const historyPrompt = chatHistory
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const prompt = `You are an AI assistant analyzing a specific uploaded document.
Answer the user's question accurately and strictly based ONLY on the Document Text provided below.

INSTRUCTIONS:
1. Ground your answer completely in the Document Text.
2. If the answer cannot be found in or deduced directly from the document text, reply EXACTLY:
   "This information is not specified in the uploaded document."
3. Never guess, synthesize facts from outside sources, use demo data, or rely on previous document contents.
4. Reference relevant wording, sections, or details from the document text where applicable.

Document Text:
"""
${documentText}
"""

${historyPrompt ? `Previous Conversation:\n${historyPrompt}\n` : ''}
User Question: ${question}`;

  const { text } = await generateText({
    model,
    prompt,
  });

  return text;
}
