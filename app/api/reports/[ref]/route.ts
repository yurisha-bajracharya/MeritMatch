import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getDb } from "@/lib/db";

/** Status of one report, for the person who made it (secret link only). */
export async function GET(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const k = new URL(req.url).searchParams.get("k") ?? "";
  const r = getDb()
    .prepare(
      `SELECT r.ref, r.access_token, r.category, r.status, r.reporter_message, r.created_at, r.updated_at,
              j.title AS job_title, COALESCE(v.business_name, '') AS business_name
         FROM reports r LEFT JOIN jobs j ON j.id = r.job_id
         LEFT JOIN employer_verifications v ON v.employer_id = r.employer_id
        WHERE r.ref = ?`,
    )
    .get(ref.toUpperCase()) as any;
  const ok =
    r && k.length === r.access_token.length && timingSafeEqual(Buffer.from(k), Buffer.from(r.access_token));
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Internal notes and the employer's documents are never included.
  return NextResponse.json({
    ref: r.ref,
    category: r.category,
    status: r.status,
    message: r.reporter_message,
    job_title: r.job_title || "",
    business_name: r.business_name,
    created_at: r.created_at,
    updated_at: r.updated_at,
  });
}
