import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";

/** ID checks waiting for a decision first. No file contents here. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = getDb()
    .prepare(
      `SELECT i.user_id, i.doc_type, i.name_on_doc, i.status, i.note, i.submitted_at, i.reviewed_at,
              i.front_mime, i.back_mime, (i.front_path != '') AS has_front, (i.back_path != '') AS has_back,
              u.name AS account_name, u.phone
         FROM identity_verifications i JOIN users u ON u.id = i.user_id
        ORDER BY CASE i.status WHEN 'submitted' THEN 0 WHEN 'needs_info' THEN 1 ELSE 2 END, i.submitted_at DESC`,
    )
    .all();
  return NextResponse.json(rows);
}
