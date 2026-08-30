import { NextResponse } from "next/server";
import { parseNoticeText } from "@/lib/ai";
import { sampleNoticeData } from "@/types/notice";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let text = "";
    let useMock = false;

    // Handle JSON requests from the frontend
    if (contentType.includes("application/json")) {
      const body = await request.json();

      text = typeof body.text === "string" ? body.text : "";
      useMock = Boolean(body.useMock);
    }

    // Handle FormData requests
    else if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await request.formData();

      const textValue = formData.get("text");
      const mockValue = formData.get("useMock");

      text = typeof textValue === "string" ? textValue : "";
      useMock = mockValue === "true" || mockValue === "1";
    }

    else {
      return NextResponse.json(
        {
          error: `Unsupported Content-Type: ${contentType}`,
        },
        { status: 415 }
      );
    }

    // Demo button
    if (useMock) {
      return NextResponse.json({
        data: sampleNoticeData,
        source: "mock",
      });
    }

    // Check notice text
    if (!text.trim()) {
      return NextResponse.json(
        {
          error: "No notice text provided",
        },
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
            "Gemini API Key missing. Please set GOOGLE_GENERATIVE_AI_API_KEY in .env.local.",
        },
        { status: 500 }
      );
    }

    // Analyze notice using Gemini
    const data = await parseNoticeText(text);

    return NextResponse.json({
      data,
      source: "ai",
    });
  } catch (error: unknown) {
    console.error("Analysis error:", error);

    const errMessage =
      error instanceof Error
        ? error.message
        : "Failed to analyze notice";

    return NextResponse.json(
      {
        error: errMessage,
      },
      { status: 500 }
    );
  }
}