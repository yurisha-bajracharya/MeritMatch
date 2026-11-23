import fs from "fs";
import path from "path";
import { getDb } from "./db";
import { PRIVATE_DIR } from "./verification";

export function verifiedIdPhones(): Set<string> {
  const rows = getDb()
    .prepare(
      `SELECT u.phone
       FROM identity_verifications iv
       JOIN users u ON u.id = iv.user_id
       WHERE iv.status = 'approved'`,
    )
    .all() as { phone: string }[];

  return new Set(rows.map((row) => row.phone).filter(Boolean));
}

export function deleteIdFiles(files: { front_path?: string; back_path?: string }): void {
  for (const filePath of [files.front_path, files.back_path]) {
    if (!filePath) continue;
    const full = path.resolve(PRIVATE_DIR, filePath);
    if (full.startsWith(PRIVATE_DIR + path.sep)) {
      fs.rmSync(full, { force: true });
    }
  }
}
