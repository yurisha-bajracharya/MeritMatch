import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { tokenOpens } from "@/lib/access";

/**
 * Only the candidate who holds the secret outcome link can share or withdraw
 * consent. Before, anyone who knew a submission id could flip it.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const consent = Boolean(body.consent);

  if (!tokenOpens(id, String(body.k ?? ""))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  getDb()
    .prepare("UPDATE submissions SET consent = ? WHERE id = ?")
    .run(consent ? 1 : 0, id);

  return NextResponse.json({ ok: true, consent });
}
