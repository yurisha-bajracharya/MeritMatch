import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/**
 * A candidate links to the organisation that trained them, with explicit
 * consent to share their job outcomes (not their answers) with it.
 */
export async function GET() {
  const u = await getSessionUser();
  if (u?.role !== "candidate") return NextResponse.json({ error: "Log in as a job seeker" }, { status: 401 });
  const row = getDb()
    .prepare("SELECT o.name, o.code, u.org_consent_at FROM users u JOIN organizations o ON o.id = u.org_id WHERE u.id = ?")
    .get(u.id) as any;
  return NextResponse.json(row ? { linked: true, name: row.name, code: row.code, since: row.org_consent_at } : { linked: false });
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (u?.role !== "candidate") return NextResponse.json({ error: "Log in as a job seeker" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.consent !== true) return NextResponse.json({ error: "Please agree to share your job outcomes first." }, { status: 400 });
  const org = getDb().prepare("SELECT id, name FROM organizations WHERE code = ?").get(String(body.code ?? "").trim().toUpperCase()) as any;
  if (!org) return NextResponse.json({ error: "No organisation with that code." }, { status: 404 });
  getDb().prepare("UPDATE users SET org_id = ?, org_consent_at = ? WHERE id = ?").run(org.id, new Date().toISOString(), u.id);
  return NextResponse.json({ linked: true, name: org.name });
}

export async function DELETE() {
  const u = await getSessionUser();
  if (u?.role !== "candidate") return NextResponse.json({ error: "Log in as a job seeker" }, { status: 401 });
  getDb().prepare("UPDATE users SET org_id = '', org_consent_at = '' WHERE id = ?").run(u.id);
  return NextResponse.json({ linked: false });
}
