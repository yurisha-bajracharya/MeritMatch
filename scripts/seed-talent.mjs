// Demo data for the talent pool and "Top talent" tags.
// Run after:  node scripts/seed.mjs   and   node scripts/seed-org.mjs
// Safe to run twice. All people are the fictional Sabal trainees.
import Database from "better-sqlite3";
import path from "path";
import { randomBytes } from "crypto";

const db = new Database(path.join(process.cwd(), "data", "meritmatch.db"));
const id = () => randomBytes(8).toString("hex");
db.exec(`
  CREATE TABLE IF NOT EXISTS talent_pool (phone TEXT PRIMARY KEY, joined_at TEXT NOT NULL, terms_version TEXT NOT NULL DEFAULT 'v1', source TEXT NOT NULL DEFAULT 'application');
  CREATE TABLE IF NOT EXISTS talent_tags (id TEXT PRIMARY KEY, phone TEXT NOT NULL, tag TEXT NOT NULL, employer_id TEXT NOT NULL, job_id TEXT NOT NULL,
    submission_id TEXT NOT NULL, score INTEGER NOT NULL, given_by TEXT NOT NULL DEFAULT 'human', hidden INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL, expires_at TEXT NOT NULL, UNIQUE(submission_id, tag));
  CREATE TABLE IF NOT EXISTS talent_invites (id TEXT PRIMARY KEY, employer_id TEXT NOT NULL, job_id TEXT NOT NULL, phone TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, submission_id TEXT NOT NULL DEFAULT '', UNIQUE(job_id, phone));
`);

const CATEGORY_SKILL = {
  retail: "customer-service", admin: "organization", office: "data-entry", hospitality: "cooking", teaching: "teaching",
  driving: "driving", construction: "physical-fitness", "it-support": "digital-literacy", tailoring: "tailoring",
};

const rows = db
  .prepare(
    `SELECT u.phone, u.name, s.id AS sub, s.total, s.tags, s.created_at, j.id AS job_id, j.category, j.employer_id,
            (SELECT 1 FROM unlocks x WHERE x.submission_id = s.id) AS unlocked
       FROM users u JOIN candidates c ON c.phone = u.phone JOIN submissions s ON s.candidate_id = c.id JOIN jobs j ON j.id = s.job_id
      WHERE u.phone LIKE '98199%'`,
  )
  .all();

const addPool = db.prepare("INSERT OR IGNORE INTO talent_pool (phone, joined_at, terms_version, source) VALUES (?, ?, 'v1', 'application')");
const addTag = db.prepare(
  `INSERT OR IGNORE INTO talent_tags (id, phone, tag, employer_id, job_id, submission_id, score, given_by, created_at, expires_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, 'human', ?, ?)`,
);
let pool = 0, tags = 0;
for (const r of rows) {
  // Most trainees ticked "Add me to the talent pool"; one did not (to show it's optional).
  if (r.name === "Bina Shrestha") continue;
  pool += addPool.run(r.phone, r.created_at).changes;
  // Top talent is given during blind review, so it is dated at the application.
  if (r.total >= 70) {
    const main = CATEGORY_SKILL[r.category];
    const tag = main || JSON.parse(r.tags || "[]")[0];
    if (!tag) continue;
    const at = new Date(new Date(r.created_at).getTime() + 2 * 86_400_000);
    const exp = new Date(at);
    exp.setMonth(exp.getMonth() + 12);
    tags += addTag.run(id() + id(), r.phone, tag, r.employer_id, r.job_id, r.sub, r.total, at.toISOString(), exp.toISOString()).changes;
  }
}
console.log(`Talent pool: ${pool} people added, ${tags} Top talent tags.`);
console.log("  Employer search: log in as 9800000001, then My jobs -> Find top talent");
