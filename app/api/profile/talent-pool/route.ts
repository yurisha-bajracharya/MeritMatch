import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { inPool, joinPool, leavePool, topTagsFor } from "@/lib/talent";

/** A candidate's own talent-pool status and Top talent tags. */
export async function GET() {
  const u = await getSessionUser();
  if (!u || u.role !== "candidate") return NextResponse.json({ error: "Log in" }, { status: 401 });
  const invites = getDb()
    .prepare(
      `SELECT i.id, i.job_id, i.created_at, i.submission_id, j.title FROM talent_invites i JOIN jobs j ON j.id = i.job_id
        WHERE i.phone = ? ORDER BY i.created_at DESC LIMIT 10`,
    )
    .all(u.phone);
  return NextResponse.json({ inPool: inPool(u.phone), tags: topTagsFor(u.phone, true), invites });
}

/** { join: boolean } or { tagId, hidden: boolean } */
export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "candidate") return NextResponse.json({ error: "Log in" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (typeof b.join === "boolean") b.join ? joinPool(u.phone, "dashboard") : leavePool(u.phone);
  if (b.tagId && typeof b.hidden === "boolean")
    getDb().prepare("UPDATE talent_tags SET hidden = ? WHERE id = ? AND phone = ?").run(b.hidden ? 1 : 0, String(b.tagId), u.phone);
  return NextResponse.json({ ok: true, inPool: inPool(u.phone) });
}
