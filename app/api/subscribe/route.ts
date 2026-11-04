import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC")
    .all(session.userId) as any[];

  const subs = rows.map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    tags: JSON.parse(r.tags || "[]"),
    category: r.category || "",
    created_at: r.created_at,
  }));

  return NextResponse.json(subs);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tags = [], category = "" } = body;

    if (!tags.length && !category) {
      return NextResponse.json(
        { error: "At least one tag or category is required" },
        { status: 400 },
      );
    }

    const db = getDb();
    const id = newId();
    db.prepare(
      `INSERT INTO subscriptions (id, user_id, tags, category, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(id, session.userId, JSON.stringify(tags), category, new Date().toISOString());

    return NextResponse.json({ id, tags, category }, { status: 201 });
  } catch (err) {
    console.error("POST /api/subscribe error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const subId = searchParams.get("id");
  if (!subId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("DELETE FROM subscriptions WHERE id = ? AND user_id = ?").run(
    subId,
    session.userId,
  );

  return NextResponse.json({ ok: true });
}
