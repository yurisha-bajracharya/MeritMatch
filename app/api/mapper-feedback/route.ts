import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { isKnownTag } from "@/lib/tags";

const tags = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set(v.map(String).filter(isKnownTag))].slice(0, 20) : [];

/**
 * Records which skills the Mapper suggested and which the person kept or
 * added. Tags only, no text and no identity. This is how we measure the
 * Mapper's real-world accuracy: kept / suggested.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const suggested = tags(body.suggested);
  if (suggested.length === 0) return NextResponse.json({ ok: true });
  getDb()
    .prepare("INSERT INTO mapper_feedback (id, suggested, kept, added, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(newId(), JSON.stringify(suggested), JSON.stringify(tags(body.kept)), JSON.stringify(tags(body.added)), new Date().toISOString());
  return NextResponse.json({ ok: true });
}

/** Public, anonymous aggregate: how often people keep what we suggest. */
export async function GET() {
  const rows = getDb().prepare("SELECT suggested, kept, added FROM mapper_feedback").all() as any[];
  let suggested = 0, kept = 0, added = 0;
  for (const r of rows) {
    const s: string[] = JSON.parse(r.suggested);
    const k: string[] = JSON.parse(r.kept);
    suggested += s.length;
    kept += k.filter((t) => s.includes(t)).length;
    added += JSON.parse(r.added).length;
  }
  return NextResponse.json({
    sessions: rows.length,
    suggested,
    kept,
    added,
    acceptanceRate: suggested ? Math.round((kept / suggested) * 100) : null,
  });
}
