import { NextResponse } from "next/server";
import { translateExperience } from "@/lib/translator";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const text = String(body?.text ?? "").trim().slice(0, 1500);
  const lang = body?.lang === "en" ? "en" : "ne";
  if (text.length < 10) {
    return NextResponse.json({ error: "Please describe your work in a sentence or more" }, { status: 400 });
  }
  return NextResponse.json(await translateExperience(text, lang));
}
