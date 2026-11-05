import fs from "fs";
import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { tokenOpens } from "@/lib/access";
import {
  expiryFor,
  LIMITS,
  mediaPath,
  purgeExpiredMedia,
  sniff,
  stripJpegMetadata,
  UPLOAD_DIR,
} from "@/lib/media";

export const runtime = "nodejs";

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

/**
 * Candidate uploads proof-of-work for their own submission.
 *  - needs the secret outcome-link token
 *  - photos: only if the job asked for photos
 *  - video: only if the job asked for video AND the candidate is shortlisted
 *    (a face on camera would otherwise break anonymity for everyone else)
 */
export async function POST(req: Request) {
  try {
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > LIMITS.maxVideoBytes + 1_000_000) {
      return fail("File is too large.", 413);
    }

    const form = await req.formData();
    const submissionId = String(form.get("submission_id") ?? "");
    const token = String(form.get("k") ?? "");
    const file = form.get("file");
    const caption = String(form.get("caption") ?? "").slice(0, 120);
    const seconds = Number(form.get("duration_sec") ?? 0);

    if (!tokenOpens(submissionId, token)) return fail("Not allowed", 403);
    if (!(file instanceof File)) return fail("No file received.", 400);

    const db = getDb();
    const sub = db
      .prepare("SELECT job_id FROM submissions WHERE id = ?")
      .get(submissionId) as { job_id: string } | undefined;
    const job = sub
      ? (db.prepare("SELECT evidence FROM jobs WHERE id = ?").get(sub.job_id) as
          | { evidence: string }
          | undefined)
      : undefined;
    if (!sub || !job) return fail("Not found", 404);

    if (job.evidence !== "photos" && job.evidence !== "video") {
      return fail("This job does not ask for photos or video.", 400);
    }

    let bytes: Buffer = Buffer.from(await file.arrayBuffer());
    const kind = sniff(bytes);
    if (!kind) {
      return fail("Unsupported file. Use a JPEG photo, or an MP4/WebM video.", 415);
    }

    if (job.evidence === "photos") {
      if (kind.kind !== "photo") return fail("This job asks for photos only.", 400);
      if (bytes.length > LIMITS.maxPhotoBytes) return fail("Photo is over 3 MB.", 413);
      const count = (
        db
          .prepare("SELECT COUNT(*) AS n FROM media WHERE submission_id = ? AND kind = 'photo'")
          .get(submissionId) as { n: number }
      ).n;
      if (count >= LIMITS.maxPhotos) {
        return fail(`You can add up to ${LIMITS.maxPhotos} photos.`, 400);
      }
      bytes = stripJpegMetadata(bytes);
    } else {
      if (kind.kind !== "video") return fail("This job asks for one short video.", 400);
      if (bytes.length > LIMITS.maxVideoBytes) return fail("Video is over 30 MB.", 413);
      if (seconds > LIMITS.maxVideoSeconds) {
        return fail("Video must be 90 seconds or shorter.", 400);
      }
      const row = db
        .prepare("SELECT shortlisted FROM submissions WHERE id = ?")
        .get(submissionId) as { shortlisted: number } | undefined;
      if (!row?.shortlisted) {
        return fail("Video is requested only from candidates the employer has shortlisted.", 403);
      }
      const has = (
        db
          .prepare("SELECT COUNT(*) AS n FROM media WHERE submission_id = ? AND kind = 'video'")
          .get(submissionId) as { n: number }
      ).n;
      if (has >= 1) return fail("You already added a video. Delete it to replace it.", 400);
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const id = newId() + newId();
    const fileName = `${id}.${kind.ext}`;
    fs.writeFileSync(mediaPath(fileName), bytes, { mode: 0o600 });

    db.prepare(
      `INSERT INTO media (id, submission_id, kind, mime, bytes, path, caption, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      submissionId,
      kind.kind,
      kind.mime,
      bytes.length,
      fileName,
      caption,
      new Date().toISOString(),
      expiryFor(kind.kind),
    );

    purgeExpiredMedia();
    return NextResponse.json({ id, kind: kind.kind, bytes: bytes.length }, { status: 201 });
  } catch (err) {
    console.error("POST /api/media error:", err);
    return fail("Upload failed.", 500);
  }
}
