import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const type = q.get("type");
  const id = q.get("id");
  const rows = getDb()
    .prepare(
      `SELECT * FROM audit_log ${type && id ? "WHERE target_type = ? AND target_id = ?" : ""} ORDER BY created_at DESC LIMIT 300`,
    )
    .all(...(type && id ? [type, id] : []));
  return NextResponse.json(rows);
}
