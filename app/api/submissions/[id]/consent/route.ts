import { NextResponse } from "next/server";
import { updateDb } from "@/lib/store";

// The submission id acts as the candidate's private link in this demo (no accounts).
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (typeof body?.consent !== "boolean") {
    return NextResponse.json(
      { error: "consent must be true or false" },
      { status: 400 },
    );
  }
  const found = await updateDb((db) => {
    const sub = db.submissions.find((s) => s.id === id);
    if (sub) sub.consent = body.consent;
    return Boolean(sub);
  });
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ consent: body.consent });
}
