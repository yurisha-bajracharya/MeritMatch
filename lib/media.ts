import fs from "fs";
import path from "path";
import { getDb } from "./db";

/**
 * Photo and video proof-of-work.
 *
 * Files live in data/uploads, OUTSIDE the public folder, and are only ever
 * returned by /api/media/[id] after an owner check. Nothing here sends a file
 * to an AI service.
 */

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export const LIMITS = {
  maxPhotos: 4,
  maxPhotoBytes: 3 * 1024 * 1024,
  maxVideoBytes: 30 * 1024 * 1024,
  maxVideoSeconds: 90,
  photoRetentionDays: 180,
  videoRetentionDays: 30,
} as const;

export type Sniffed = { kind: "photo" | "video"; mime: string; ext: string } | null;

/** Identify a file by its first bytes, never by the name or type the client claims. */
export function sniff(buf: Buffer): Sniffed {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF. We accept JPEG only for photos because the browser
  // re-encodes every photo to JPEG, which also drops location (EXIF) data.
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { kind: "photo", mime: "image/jpeg", ext: "jpg" };
  }
  // MP4 / MOV: "ftyp" at offset 4
  if (buf.toString("latin1", 4, 8) === "ftyp") {
    const brand = buf.toString("latin1", 8, 12);
    return brand.startsWith("qt")
      ? { kind: "video", mime: "video/quicktime", ext: "mov" }
      : { kind: "video", mime: "video/mp4", ext: "mp4" };
  }
  // WebM / Matroska: 1A 45 DF A3
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return { kind: "video", mime: "video/webm", ext: "webm" };
  }
  return null;
}

/**
 * Remove personal metadata from a JPEG without re-encoding it.
 * Drops APP1 (EXIF incl. GPS, XMP), APP3-APP13 (incl. Photoshop/IPTC) and
 * COM comments. Keeps APP0 (JFIF) and APP2 (colour profile) so the picture
 * looks the same. The browser already re-encodes, so this is a second layer
 * for anything that reaches the server some other way.
 */
export function stripJpegMetadata(buf: Buffer): Buffer {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return buf;
  const out: Buffer[] = [buf.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) break;
    const marker = buf[i + 1];
    // Start of scan: the rest is image data, copy as-is.
    if (marker === 0xda) {
      out.push(buf.subarray(i));
      return Buffer.concat(out);
    }
    // Standalone markers without a length.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      out.push(buf.subarray(i, i + 2));
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > buf.length) break;
    const drop =
      marker === 0xe1 || (marker >= 0xe3 && marker <= 0xed) || marker === 0xfe;
    if (!drop) out.push(buf.subarray(i, i + 2 + len));
    i += 2 + len;
  }
  return Buffer.concat(out);
}

export const mediaPath = (fileName: string) => path.join(UPLOAD_DIR, fileName);

/** Delete files and rows past their retention date. Called opportunistically. */
export function purgeExpiredMedia(now = new Date()): number {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, path FROM media WHERE expires_at < ?")
    .all(now.toISOString()) as { id: string; path: string }[];
  for (const r of rows) {
    try {
      fs.unlinkSync(mediaPath(r.path));
    } catch {}
    db.prepare("DELETE FROM media WHERE id = ?").run(r.id);
  }
  return rows.length;
}

export const expiryFor = (kind: "photo" | "video", from = new Date()): string => {
  const days =
    kind === "photo" ? LIMITS.photoRetentionDays : LIMITS.videoRetentionDays;
  return new Date(from.getTime() + days * 86_400_000).toISOString();
};
