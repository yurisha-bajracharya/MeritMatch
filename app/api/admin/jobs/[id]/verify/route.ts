import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { updateDb } from "@/lib/store";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(req))
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (typeof body?.verified !== "boolean") {
    return NextResponse.json(
      { error: "verified must be true or false" },
      { status: 400 },
    );
  }

  const job = await updateDb((db) => {
    const j = db.jobs.find((x) => x.id === id);
    if (j) {
      j.verified = body.verified;
      j.verifiedAt = body.verified ? new Date().toISOString() : undefined;
    }
    return j;
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job });
}
