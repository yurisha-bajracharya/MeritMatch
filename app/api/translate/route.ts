import { NextResponse } from "next/server";
import { devanagariShare, toEnglish, translateExperience } from "@/lib/translator";
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
    const clipped = text.slice(0, 2000);
    // Map the skills and (for Nepali) make an English version, in parallel.
    const [result, en] = await Promise.all([translateExperience(clipped, lang as Lang), toEnglish(clipped)]);
    return NextResponse.json({
      ...result,
      english: en?.english ?? "",
      // Nepali text but no AI to translate it: say so instead of failing quietly.
      english_unavailable: !en && devanagariShare(clipped) >= 0.2,
    });
  } catch (err) {
    console.error("POST /api/translate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Translation failed" },
      { status: 500 },
    );
  }
}
