import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rowToJob } from "@/lib/shortlist";
import { getTemplate, toPublicTemplate } from "@/lib/templates";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { badgesMap, isPublicJob } from "@/lib/verification";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();
  const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as any;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Pending, suspended or restricted jobs are visible only to their owner
  // (to preview) and to admins.
  if (!isPublicJob(row)) {
    const session = await getSession();
    const owner = session?.role === "employer" && session.userId === row.employer_id;
    if (!owner && !isAdmin(req)) {
      return NextResponse.json(
        { error: "This job is not open for applications.", code: "not_open" },
        { status: 404 },
      );
    }
  }

  const job = rowToJob(row);
  const template = getTemplate(job.category);
  return NextResponse.json({
    ...job,
    // Applicants never see the reviewer's notes to the employer.
    review_note: undefined,
    employer_badges: badgesMap([job.employer_id]).get(job.employer_id) ?? {
      contact: false,
      documents: false,
      employer: false,
    },
    template: toPublicTemplate(template),
  });
}
