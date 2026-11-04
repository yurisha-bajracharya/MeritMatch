import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const verified = Boolean(body.verified);

  const db = getDb();
  const job = db.prepare("SELECT id FROM jobs WHERE id = ?").get(id) as any;
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.prepare("UPDATE jobs SET verified = ?, verified_at = ? WHERE id = ?").run(
    verified ? 1 : 0,
    verified ? new Date().toISOString() : "",
    id,
  );

  return NextResponse.json({ ok: true, verified });
}
