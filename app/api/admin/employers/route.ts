import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { badgesFor, evidenceFor, getVerification } from "@/lib/verification";

/** Every employer account with its verification state, newest activity first. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const users = db
    .prepare("SELECT id, name, phone, restricted, restricted_reason, created_at FROM users WHERE role = 'employer'")
    .all() as any[];
  const list = users.map((u) => {
    const v = getVerification(u.id);
    const count = (sql: string) => (db.prepare(sql).get(u.id) as { n: number }).n;
    return {
      id: u.id,
      account_name: u.name,
      phone: u.phone,
      restricted: Boolean(u.restricted),
      restricted_reason: u.restricted_reason,
      business_name: v.business_name,
      contact_name: v.contact_name,
      contact_position: v.contact_position,
      email: v.email,
      authorized: Boolean(v.authorized),
      phone_verified_at: v.phone_verified_at,
      business_status: v.business_status,
      business_note: v.business_note,
      presence_status: v.presence_status,
      presence_note: v.presence_note,
      manual_note: v.manual_note,
      updated_at: v.updated_at,
      badges: badgesFor(v),
      evidence: evidenceFor(u.id),
      jobs: count("SELECT COUNT(*) AS n FROM jobs WHERE employer_id = ?"),
      open_reports: count("SELECT COUNT(*) AS n FROM reports WHERE employer_id = ? AND status IN ('new','under_review','awaiting_info')"),
    };
  });
  list.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return NextResponse.json(list);
}
