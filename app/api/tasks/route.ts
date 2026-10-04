import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "CampusPilot Tasks API is working.",
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Task API is ready.",
  });
}