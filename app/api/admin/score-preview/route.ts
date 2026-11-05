import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getTemplate } from "@/lib/templates";
import { scoreAnswers } from "@/lib/scoring";
import { CATEGORIES, type Category } from "@/lib/types";

/**
 * Admin-only: score a piece of text WITHOUT saving anything. This exists so
 * the scorer can be checked against human-marked answers (scripts/calibrate.mjs)
 * before anyone relies on it.
 *
 * Body: { category, answers: string[], useAI?: boolean }
 * `answers[i]` is the answer to the template's i-th scenario.
 */
export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const category = body.category as Category;
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }
  const template = getTemplate(category);
  const list: string[] = Array.isArray(body.answers) ? body.answers.map(String) : [];

  const result = await scoreAnswers(
    template,
    template.scenarios.map((s, i) => ({ scenarioId: s.id, text: list[i] ?? "" })),
    body.useAI !== false,
  );
  return NextResponse.json(result);
}
