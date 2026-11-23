import fs from "fs";
import path from "path";
import { getDb } from "./db";
import { PRIVATE_DIR } from "./verification";

/**
 * Optional identity check for candidates.
 *
 *  - The candidate uploads a photo of ONE government ID and types their name
 *    as written on it.
 *  - A MeritMatch reviewer compares it with the account name and decides.
 *  - The ID images are deleted the moment a decision is made. We keep only
 *    "verified / not verified", the document type and the date.
 *  - Employers never see the document. They see an "ID verified" badge, and
 *    the name only after the usual shortlist + consent + unlock.
 *  - It is optional and never changes a score or rank: many people in Nepal,
 *    especially women, do not yet have a citizenship certificate.
 */

import { ID_TYPES, ID_LABEL, type IdStatus, type IdType } from "./identity-types";
export { ID_TYPES, ID_LABEL };
export type { IdStatus, IdType };

export type IdentityRow = {
  user_id: string;
  doc_type: IdType;
  name_on_doc: string;
  front_path: string;
  front_mime: string;
  back_path: string;
  back_mime: string;
  status: IdStatus;
  note: string;
  submitted_at: string;
  reviewed_at: string;
};

export function getIdentity(userId: string): IdentityRow | undefined {
  return getDb().prepare("SELECT * FROM identity_verifications WHERE user_id = ?").get(userId) as IdentityRow | undefined;
}

/** Deletes the stored ID images (keeps the row). */
export function deleteIdFiles(row: Pick<IdentityRow, "front_path" | "back_path">) {
  for (const rel of [row.front_path, row.back_path]) {
    if (!rel) continue;
    const full = path.resolve(PRIVATE_DIR, rel);
    if (full.startsWith(PRIVATE_DIR + path.sep)) fs.rmSync(full, { force: true });
  }
}

/** Phone numbers of candidates whose ID was verified (for employer views). */
export function verifiedIdPhones(): Set<string> {
  const rows = getDb()
    .prepare(
      "SELECT u.phone FROM identity_verifications i JOIN users u ON u.id = i.user_id WHERE i.status = 'approved'",
    )
    .all() as { phone: string }[];
  return new Set(rows.map((r) => r.phone));
}
