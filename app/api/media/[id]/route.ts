import fs from "fs";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { employerOwnsSubmission, tokenOpens } from "@/lib/access";
import { mediaPath } from "@/lib/media";

export const runtime = "nodejs";

type Row = {
  id: string;
  submission_id: string;
  kind: string;
  mime: string;
  bytes: number;
  path: string;
  expires_at: string;
};

const find = (id: string) =>
  getDb().prepare("SELECT * FROM media WHERE id = ?").get(id) as Row | undefined;

/**
 * Serve a photo or video ONLY to:
 *  - the employer who owns the job, or
 *  - the candidate holding the outcome-link token (?k=).
 * Everyone else gets 404 (not 403) so ids can't be probed.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = find(id);
  const notFound = () => new NextResponse("Not found", { status: 404 });
  if (!row) return notFound();

  const k = new URL(req.url).searchParams.get("k");
  const allowed =
    tokenOpens(row.submission_id, k) || (await employerOwnsSubmission(row.submission_id));
  if (!allowed) return notFound();

  if (row.expires_at < new Date().toISOString()) return notFound();

  let stat: fs.Stats;
  try {
    stat = fs.statSync(mediaPath(row.path));
  } catch {
    return notFound();
  }

  const headers: Record<string, string> = {
    "Content-Type": row.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
  };

  // Byte ranges, so video can seek and play on phones.
  const range = req.headers.get("range");
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range);
  if (m) {
    let start = m[1] ? parseInt(m[1], 10) : 0;
    let end = m[2] ? parseInt(m[2], 10) : stat.size - 1;
    if (!m[1] && m[2]) {
      start = Math.max(0, stat.size - parseInt(m[2], 10));
      end = stat.size - 1;
    }
    end = Math.min(end, stat.size - 1);
    if (start > end || start >= stat.size) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${stat.size}` },
      });
    }
    const buf = Buffer.alloc(end - start + 1);
    const fd = fs.openSync(mediaPath(row.path), "r");
    try {
      fs.readSync(fd, buf, 0, buf.length, start);
    } finally {
      fs.closeSync(fd);
    }
    return new NextResponse(new Uint8Array(buf), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Content-Length": String(buf.length),
      },
    });
  }

  return new NextResponse(new Uint8Array(fs.readFileSync(mediaPath(row.path))), {
    status: 200,
    headers: { ...headers, "Content-Length": String(stat.size) },
  });
}

/** The candidate can remove their own upload at any time. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = find(id);
  const k = new URL(req.url).searchParams.get("k");
  if (!row || !tokenOpens(row.submission_id, k)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    fs.unlinkSync(mediaPath(row.path));
  } catch {}
  getDb().prepare("DELETE FROM media WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
