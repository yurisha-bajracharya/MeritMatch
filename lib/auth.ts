import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { getDb, newId } from "./db";
import { cleanCityIds } from "./places";
import type { Role, User } from "./types";

const COOKIE_NAME = "mm_session";

/**
 * The session cookie is signed. Without a signature anyone who knew (or
 * guessed) a user id could write their own cookie and become that employer,
 * which would expose that employer's candidates and any photos or videos.
 *
 * Secret: SESSION_SECRET if set (use this in production), otherwise a random
 * one generated once and kept in data/.session-secret.
 */
let _secret: string | null = null;
function secret(): string {
  if (_secret) return _secret;
  if (process.env.SESSION_SECRET) return (_secret = process.env.SESSION_SECRET);
  const file = path.join(process.cwd(), "data", ".session-secret");
  try {
    _secret = fs.readFileSync(file, "utf8").trim();
    if (_secret) return _secret;
  } catch {}
  fs.mkdirSync(path.dirname(file), { recursive: true });
  _secret = randomBytes(32).toString("hex");
  fs.writeFileSync(file, _secret, { mode: 0o600 });
  return _secret;
}

const sign = (payload: string) =>
  createHmac("sha256", secret()).update(payload).digest("base64url");

function encodeSession(data: { userId: string; role: Role }): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(raw: string): { userId: string; role: Role } | null {
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.userId && (data.role === "candidate" || data.role === "employer")) {
      return { userId: String(data.userId), role: data.role };
    }
  } catch {}
  return null;
}

/** Create or find user by phone, return user object */
export async function loginOrCreate(data: {
  name: string;
  phone: string;
  email?: string;
  role: Role;
  gender?: string;
  region?: string;
  skills?: string[];
  preferred_cities?: string[];
  experience_text?: string;
}): Promise<User> {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM users WHERE phone = ?")
    .get(data.phone) as any;

  const cities =
    data.preferred_cities === undefined
      ? undefined
      : cleanCityIds(data.preferred_cities);

  if (existing) {
    // Update name/role if changed
    db.prepare(
      "UPDATE users SET name = ?, role = ?, gender = ?, region = ?, skills = ?, preferred_cities = ?, email = ?, experience_text = ? WHERE id = ?",
    ).run(
      // Logging in sends no name; keep the one on file instead of blanking it.
      data.name || existing.name,
      data.role,
      data.gender ?? existing.gender,
      data.region ?? existing.region,
      JSON.stringify(data.skills ?? JSON.parse(existing.skills || "[]")),
      JSON.stringify(cities ?? JSON.parse(existing.preferred_cities || "[]")),
      data.email ?? existing.email,
      data.experience_text ?? existing.experience_text,
      existing.id,
    );
    return rowToUser(
      db.prepare("SELECT * FROM users WHERE id = ?").get(existing.id) as any,
    );
  }

  const id = newId();
  db.prepare(
    `INSERT INTO users (id, name, phone, email, role, gender, region, skills, preferred_cities, experience_text, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    data.name,
    data.phone,
    data.email ?? "",
    data.role,
    data.gender ?? "",
    data.region ?? "",
    JSON.stringify(data.skills ?? []),
    JSON.stringify(cities ?? []),
    data.experience_text ?? "",
    new Date().toISOString(),
  );

  return rowToUser(
    db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any,
  );
}

export async function setSessionCookie(userId: string, role: Role) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, encodeSession({ userId, role }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
  });
}

export async function getSession(): Promise<{
  userId: string;
  role: Role;
} | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}

export async function getSessionUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(session.userId) as any;
  return row ? rowToUser(row) : null;
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || "",
    role: row.role,
    gender: row.gender || "",
    region: row.region || "",
    skills: JSON.parse(row.skills || "[]"),
    preferred_cities: JSON.parse(row.preferred_cities || "[]"),
    experience_text: row.experience_text || "",
    created_at: row.created_at,
  };
}
