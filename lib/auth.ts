import { cookies } from "next/headers";
import { getDb, newId } from "./db";
import type { Role, User } from "./types";

const COOKIE_NAME = "mm_session";

/** Create or find user by phone, return user object */
export async function loginOrCreate(data: {
  name: string;
  phone: string;
  email?: string;
  role: Role;
  gender?: string;
  region?: string;
  skills?: string[];
  experience_text?: string;
}): Promise<User> {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM users WHERE phone = ?")
    .get(data.phone) as any;

  if (existing) {
    // Update name/role if changed
    db.prepare(
      "UPDATE users SET name = ?, role = ?, gender = ?, region = ?, skills = ?, email = ?, experience_text = ? WHERE id = ?",
    ).run(
      data.name,
      data.role,
      data.gender ?? existing.gender,
      data.region ?? existing.region,
      JSON.stringify(data.skills ?? JSON.parse(existing.skills || "[]")),
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
    `INSERT INTO users (id, name, phone, email, role, gender, region, skills, experience_text, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    data.name,
    data.phone,
    data.email ?? "",
    data.role,
    data.gender ?? "",
    data.region ?? "",
    JSON.stringify(data.skills ?? []),
    data.experience_text ?? "",
    new Date().toISOString(),
  );

  return rowToUser(
    db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any,
  );
}

export async function setSessionCookie(userId: string, role: Role) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, JSON.stringify({ userId, role }), {
    httpOnly: true,
    sameSite: "lax",
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
  try {
    const data = JSON.parse(raw);
    if (data.userId && data.role) return data;
  } catch {}
  return null;
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

function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || "",
    role: row.role,
    gender: row.gender || "",
    region: row.region || "",
    skills: JSON.parse(row.skills || "[]"),
    experience_text: row.experience_text || "",
    created_at: row.created_at,
  };
}
