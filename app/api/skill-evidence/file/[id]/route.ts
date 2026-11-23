import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { readPrivateFile } from "@/lib/verification";
import { employerCanSeeUser } from "@/lib/skill-evidence";

/**
 * A skill photo. Visible to: the person who added it, admins, and employers
 * the person applied to. Nobody else, and never cached.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = getDb().prepare("SELECT user_id, path, mime, status FROM skill_evidence WHERE id = ?").get(id) as
    | { user_id: string; path: string; mime: string; status: string }
    | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const s = await getSession();
  const allowed =
    isAdmin(req) ||
    (s?.role === "candidate" && s.userId === row.user_id) ||
    (s?.role === "employer" && row.status !== "rejected" && employerCanSeeUser(s.userId, row.user_id));
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const buf = readPrivateFile(row.path);
  if (!buf) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(buf), {
    headers: { "Content-Type": row.mime, "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" },
  });
}
