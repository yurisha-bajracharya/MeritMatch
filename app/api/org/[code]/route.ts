import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getDb } from "@/lib/db";
import { orgReport } from "@/lib/outcomes";

/** Organisation dashboard data. Needs the organisation's private key. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const k = new URL(req.url).searchParams.get("k") ?? "";
  const org = getDb().prepare("SELECT * FROM organizations WHERE code = ?").get(code.toUpperCase()) as any;
  const ok = org && k.length === org.access_key.length && timingSafeEqual(Buffer.from(k), Buffer.from(org.access_key));
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ org: { name: org.name, kind: org.kind, code: org.code }, ...orgReport(org.id) });
}
