import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "meritmatch.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const fs = require("fs");
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT DEFAULT '',
      role TEXT NOT NULL CHECK(role IN ('candidate', 'employer')),
      gender TEXT DEFAULT '',
      region TEXT DEFAULT '',
      skills TEXT DEFAULT '[]',
      experience_text TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      employer_name TEXT NOT NULL,
      employer_id TEXT DEFAULT '',
      location TEXT DEFAULT '',
      category TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      custom_questions TEXT DEFAULT '',
      duration_min INTEGER DEFAULT 15,
      ai_scoring INTEGER DEFAULT 1,
      verified INTEGER DEFAULT 0,
      verified_at TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      gender TEXT DEFAULT '',
      region TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      language TEXT DEFAULT 'ne',
      input_mode TEXT DEFAULT 'text',
      answers TEXT NOT NULL DEFAULT '[]',
      criteria TEXT NOT NULL DEFAULT '[]',
      total INTEGER DEFAULT 0,
      reason TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      scored_by TEXT DEFAULT 'fallback',
      consent INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      category TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      job_id TEXT DEFAULT '',
      read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_job_candidate
      ON submissions(job_id, candidate_id);

    CREATE INDEX IF NOT EXISTS idx_notifications_user
      ON notifications(user_id, read);

    CREATE INDEX IF NOT EXISTS idx_subscriptions_user
      ON subscriptions(user_id);

    CREATE INDEX IF NOT EXISTS idx_jobs_created
      ON jobs(created_at);
  `);

  migrate(_db);

  return _db;
}

/**
 * CREATE TABLE IF NOT EXISTS never alters a table that already exists, so a
 * column added later has to be applied here. Safe to run on every start:
 * it only acts when the column is missing, so existing data is kept.
 */
function hasColumn(db: Database.Database, table: string, column: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

function addColumn(
  db: Database.Database,
  table: string,
  column: string,
  definition: string,
): boolean {
  if (!hasColumn(db, table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    return true;
  }
  return false;
}

function migrate(db: Database.Database) {
  addColumn(db, "submissions", "flags", "TEXT DEFAULT '[]'");

  // Choice questions: `total` stays the single number used for ranking.
  addColumn(db, "submissions", "mcq", "TEXT DEFAULT ''");
  addColumn(db, "submissions", "mcq_score", "INTEGER");
  addColumn(db, "submissions", "written_score", "INTEGER");

  // Secret only the candidate holds (in their outcome link). Lets them see
  // their result, give consent and upload evidence without a login.
  addColumn(db, "submissions", "access_token", "TEXT DEFAULT ''");

  // The employer's own decision to shortlist someone. The top-25% rule only
  // SUGGESTS; this flag is what candidates see and what unlocks video.
  addColumn(db, "submissions", "shortlisted", "INTEGER DEFAULT 0");
  addColumn(db, "submissions", "shortlisted_at", "TEXT DEFAULT ''");
  addColumn(db, "submissions", "rejected", "INTEGER DEFAULT 0");
  // Interview invitation (only for shortlisted people) and its note.
  addColumn(db, "submissions", "interview", "INTEGER DEFAULT 0");
  addColumn(db, "submissions", "interview_note", "TEXT DEFAULT ''");
  addColumn(db, "notifications", "link", "TEXT DEFAULT ''");

  // Photos / video proof-of-work requested by the employer.
  addColumn(db, "jobs", "evidence", "TEXT DEFAULT 'none'");

  // ---- Vacancy review (layer 4). review_status is the single source of
  // truth; the older `verified` column is kept in step for compatibility.
  if (addColumn(db, "jobs", "review_status", "TEXT DEFAULT 'pending'")) {
    db.exec("UPDATE jobs SET review_status = 'approved' WHERE verified = 1");
  }
  addColumn(db, "jobs", "review_note", "TEXT DEFAULT ''");
  addColumn(db, "jobs", "reviewed_at", "TEXT DEFAULT ''");
  addColumn(db, "jobs", "responsibilities", "TEXT DEFAULT ''");
  addColumn(db, "jobs", "salary_min", "INTEGER");
  addColumn(db, "jobs", "salary_max", "INTEGER");
  addColumn(db, "jobs", "salary_period", "TEXT DEFAULT 'month'");
  addColumn(db, "jobs", "hours", "TEXT DEFAULT ''");
  addColumn(db, "jobs", "employment_type", "TEXT DEFAULT ''");
  addColumn(db, "jobs", "no_fee_confirmed", "INTEGER DEFAULT 0");

  // Admin can restrict an employer while a serious report is investigated.
  addColumn(db, "users", "restricted", "INTEGER DEFAULT 0");
  addColumn(db, "users", "restricted_reason", "TEXT DEFAULT ''");

  // City ids from lib/places.ts, JSON array.
  addColumn(db, "users", "preferred_cities", "TEXT DEFAULT '[]'");

  // Contact details stay hidden until the employer unlocks them. Payment is
  // a mock for now (amount recorded, nothing charged).
  db.exec(`
    CREATE TABLE IF NOT EXISTS unlocks (
      submission_id TEXT PRIMARY KEY,
      employer_id TEXT NOT NULL,
      amount INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('photo', 'video')),
      mime TEXT NOT NULL,
      bytes INTEGER NOT NULL,
      path TEXT NOT NULL,
      caption TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_media_submission ON media(submission_id);

    -- Human ratings of photos/video. Kept apart from the AI/MCQ score on
    -- purpose: they are never merged into the ranking total.
    CREATE TABLE IF NOT EXISTS evidence_reviews (
      submission_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      scores TEXT NOT NULL DEFAULT '{}',
      note TEXT DEFAULT '',
      reviewed_at TEXT NOT NULL,
      PRIMARY KEY (submission_id, kind)
    );

    -- Employer verification, one row per employer account. Each layer has
    -- its own status: none | submitted | needs_info | approved | rejected.
    -- Nothing is approved automatically: a person reviews every document.
    CREATE TABLE IF NOT EXISTS employer_verifications (
      employer_id TEXT PRIMARY KEY,
      business_name TEXT DEFAULT '',
      contact_name TEXT DEFAULT '',
      contact_position TEXT DEFAULT '',
      email TEXT DEFAULT '',
      authorized INTEGER DEFAULT 0,
      phone_verified_at TEXT DEFAULT '',
      otp_hash TEXT DEFAULT '',
      otp_expires TEXT DEFAULT '',
      otp_attempts INTEGER DEFAULT 0,
      business_status TEXT DEFAULT 'none',
      business_note TEXT DEFAULT '',
      presence_status TEXT DEFAULT 'none',
      presence_note TEXT DEFAULT '',
      manual_note TEXT DEFAULT '',
      updated_at TEXT NOT NULL
    );

    -- One row per piece of evidence. Alternatives, not a checklist.
    CREATE TABLE IF NOT EXISTS verification_evidence (
      id TEXT PRIMARY KEY,
      employer_id TEXT NOT NULL,
      layer TEXT NOT NULL CHECK(layer IN ('business', 'presence')),
      kind TEXT NOT NULL,
      value TEXT DEFAULT '',
      file_path TEXT DEFAULT '',
      mime TEXT DEFAULT '',
      bytes INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_evidence_employer ON verification_evidence(employer_id);

    -- Applicant reports. Never shown publicly.
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      ref TEXT UNIQUE NOT NULL,
      access_token TEXT NOT NULL,
      reporter_user_id TEXT DEFAULT '',
      reporter_contact TEXT DEFAULT '',
      employer_id TEXT DEFAULT '',
      job_id TEXT DEFAULT '',
      category TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      escalated INTEGER DEFAULT 0,
      reporter_message TEXT DEFAULT '',
      internal_note TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

    CREATE TABLE IF NOT EXISTS report_attachments (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      path TEXT NOT NULL,
      mime TEXT NOT NULL,
      bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Every admin decision, so reviews can be traced later.
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      detail TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_log(target_type, target_id);

    -- Which skills the Mapper suggested vs what the person kept. Tags only,
    -- never the text they typed. Used to measure how accurate the Mapper is.
    CREATE TABLE IF NOT EXISTS mapper_feedback (
      id TEXT PRIMARY KEY,
      suggested TEXT NOT NULL DEFAULT '[]',
      kept TEXT NOT NULL DEFAULT '[]',
      added TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
  `);
}

export const newId = () => crypto.randomUUID().slice(0, 8);
