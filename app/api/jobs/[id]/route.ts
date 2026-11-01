import { NextResponse } from "next/server";
import { readDb } from "@/lib/store";
import { getTemplate } from "@/lib/templates";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const db = await readDb();
  const job = db.jobs.find((j) => j.id === id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // The template's `signals` are scorer internals; don't expose them to candidates.
  const template = getTemplate(job.category);
  const publicTemplate = {
    ...template,
    rubric: template.rubric.map(({ id, label, max }) => ({ id, label, max })),
  };
  return NextResponse.json({ job, template: publicTemplate });
}
