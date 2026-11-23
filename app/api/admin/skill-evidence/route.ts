import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";

/** Skill photos, the ones waiting for a person first. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = getDb()
    .prepare(
      `SELECT e.id, e.user_id, e.tag, e.caption, e.status, e.ai_note, e.review_note, e.created_at, e.mime, u.name, u.experience_text, u.experience_en
         FROM skill_evidence e JOIN users u ON u.id = e.user_id
        ORDER BY CASE e.status WHEN 'needs_review' THEN 0 WHEN 'ai_checked' THEN 1 ELSE 2 END, e.created_at DESC LIMIT 300`,
    )
    .all();
  return NextResponse.json(rows);
}
