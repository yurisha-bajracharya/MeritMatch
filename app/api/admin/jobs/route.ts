import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { rowToJob } from "@/lib/shortlist";
import { badgesMap } from "@/lib/verification";

/** All vacancies, any status, with what a reviewer needs to decide. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT j.*, COALESCE(v.business_name, '') AS business_name, COALESCE(v.contact_name, '') AS contact_name,
              COALESCE(v.contact_position, '') AS contact_position, COALESCE(v.authorized, 0) AS authorized,
              COALESCE(u.phone, '') AS employer_phone, COALESCE(u.restricted, 0) AS employer_restricted,
              (SELECT COUNT(*) FROM reports r WHERE r.job_id = j.id AND r.status IN ('new','under_review','awaiting_info')) AS open_reports
         FROM jobs j LEFT JOIN users u ON u.id = j.employer_id
         LEFT JOIN employer_verifications v ON v.employer_id = j.employer_id
        ORDER BY CASE j.review_status WHEN 'pending' THEN 0 WHEN 'needs_info' THEN 1 ELSE 2 END, j.created_at DESC`,
    )
    .all() as any[];
  const badges = badgesMap(rows.map((r) => r.employer_id));
  return NextResponse.json(
    rows.map((r) => ({
      ...rowToJob(r),
      business_name: r.business_name,
      contact_name: r.contact_name,
      contact_position: r.contact_position,
      authorized: Boolean(r.authorized),
      employer_phone: r.employer_phone,
      employer_restricted: Boolean(r.employer_restricted),
      open_reports: r.open_reports,
      employer_badges: badges.get(r.employer_id) ?? { contact: false, documents: false, employer: false },
    })),
  );
}
