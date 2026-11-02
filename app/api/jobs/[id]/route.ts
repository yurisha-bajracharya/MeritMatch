import { NextResponse } from "next/server";
import { readDb } from "@/lib/store";
import { getTemplate, toPublicTemplate } from "@/lib/templates";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const db = await readDb();
  const job = db.jobs.find((j) => j.id === id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    job,
    template: toPublicTemplate(getTemplate(job.category)),
  });
}
