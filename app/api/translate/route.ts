import { NextResponse } from "next/server";
import { translateExperience } from "@/lib/translator";
import type { Lang } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, lang = "en" } = body;
    if (!text || typeof text !== "string" || text.trim().length < 5) {
      return NextResponse.json(
        { error: "Please describe your experience in a few words." },
        { status: 400 },
      );
    }
    const result = await translateExperience(text.slice(0, 2000), lang as Lang);
    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/translate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Translation failed" },
      { status: 500 },
    );
  }
}
