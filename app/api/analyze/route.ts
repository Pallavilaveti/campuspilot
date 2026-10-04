import { NextRequest, NextResponse } from "next/server";
import { analyzeNotice } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    console.log("=== CampusPilot Analyze API ===");

    const body = await request.json();

    console.log("Received notice:", body?.text ? "YES" : "NO");

    if (!body?.text || typeof body.text !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Notice text is required.",
        },
        { status: 400 }
      );
    }

    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);

    const analysis = await analyzeNotice(body.text);

    console.log("Gemini analysis successful");

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("=== CAMPUSPILOT API ERROR ===");
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}