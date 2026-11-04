import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const consent = Boolean(body.consent);

  const db = getDb();
  const sub = db.prepare("SELECT id FROM submissions WHERE id = ?").get(id) as any;
  if (!sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.prepare("UPDATE submissions SET consent = ? WHERE id = ?").run(
    consent ? 1 : 0,
    id,
  );

  return NextResponse.json({ ok: true, consent });
}
