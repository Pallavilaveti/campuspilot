import { NextResponse } from "next/server";
import { analyzeNotice } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const text =
      typeof body.text === "string"
        ? body.text.trim()
        : "";

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error: "Notice text is required.",
        },
        { status: 400 }
      );
    }

    const analysis = await analyzeNotice(text);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("CampusPilot /api/analyze error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "AI analysis failed.",
      },
      { status: 500 }
    );
  }
}