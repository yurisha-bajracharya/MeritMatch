import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { readPrivateFile } from "@/lib/verification";

/** Private documents and report screenshots. Admins only, never cached. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const id = q.get("id") ?? "";
  const kind = q.get("kind");
  const side = q.get("side") === "back" ? "back" : "front";
  const row =
    kind === "identity"
      ? (getDb().prepare(`SELECT ${side}_path AS p, ${side}_mime AS mime FROM identity_verifications WHERE user_id = ? AND ${side}_path != ''`).get(id) as any)
      : kind === "report"
      ? (getDb().prepare("SELECT path AS p, mime FROM report_attachments WHERE id = ?").get(id) as any)
      : (getDb().prepare("SELECT file_path AS p, mime FROM verification_evidence WHERE id = ? AND file_path != ''").get(id) as any);
  const buf = row ? readPrivateFile(row.p) : null;
  if (!buf) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
