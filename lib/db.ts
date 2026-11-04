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

function migrate(db: Database.Database) {
  if (!hasColumn(db, "submissions", "flags")) {
    db.exec("ALTER TABLE submissions ADD COLUMN flags TEXT DEFAULT '[]'");
  }
}

export const newId = () => crypto.randomUUID().slice(0, 8);
