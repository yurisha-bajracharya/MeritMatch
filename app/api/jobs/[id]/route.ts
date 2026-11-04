import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rowToJob } from "@/lib/shortlist";
import { getTemplate, toPublicTemplate } from "@/lib/templates";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();
  const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as any;
  if (!row)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const job = rowToJob(row);
  const template = getTemplate(job.category);
  const publicTemplate = toPublicTemplate(template);

  return NextResponse.json({
    ...job,
    template: publicTemplate,
  });
}
