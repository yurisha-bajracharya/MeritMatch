import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";

/** Reports, filterable by status, category, employer and job. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const where: string[] = [];
  const args: string[] = [];
  for (const [param, col] of [
    ["status", "r.status"],
    ["category", "r.category"],
    ["employer", "r.employer_id"],
    ["job", "r.job_id"],
  ] as const) {
    const v = q.get(param);
    if (v) {
      where.push(`${col} = ?`);
      args.push(v);
    }
  }
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT r.*, COALESCE(j.title, '') AS job_title, COALESCE(j.review_status, '') AS job_status,
              COALESCE(v.business_name, '') AS business_name, COALESCE(u.name, '') AS employer_account,
              COALESCE(u.restricted, 0) AS employer_restricted
         FROM reports r LEFT JOIN jobs j ON j.id = r.job_id
         LEFT JOIN users u ON u.id = r.employer_id
         LEFT JOIN employer_verifications v ON v.employer_id = r.employer_id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY r.escalated DESC, CASE r.status WHEN 'new' THEN 0 WHEN 'under_review' THEN 1 WHEN 'awaiting_info' THEN 2 ELSE 3 END, r.created_at DESC`,
    )
    .all(...args) as any[];
  const att = db.prepare("SELECT id, mime, bytes FROM report_attachments WHERE report_id = ?");
  return NextResponse.json(
    rows.map(({ access_token: _t, ...r }) => ({
      ...r,
      escalated: Boolean(r.escalated),
      employer_restricted: Boolean(r.employer_restricted),
      attachments: att.all(r.id),
    })),
  );
}
