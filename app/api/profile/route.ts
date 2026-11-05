import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { cleanCityIds } from "@/lib/places";
import { isKnownTag } from "@/lib/tags";

/** Save the logged-in person's skills and preferred cities. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Log in first" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const db = getDb();

  if (Array.isArray(body.skills)) {
    const skills = [...new Set(body.skills.map(String).filter(isKnownTag))].slice(0, 12);
    db.prepare("UPDATE users SET skills = ? WHERE id = ?").run(JSON.stringify(skills), session.userId);
  }
  if (Array.isArray(body.preferred_cities)) {
    db.prepare("UPDATE users SET preferred_cities = ? WHERE id = ?").run(
      JSON.stringify(cleanCityIds(body.preferred_cities)),
      session.userId,
    );
  }
  if (typeof body.experience_text === "string") {
    db.prepare("UPDATE users SET experience_text = ? WHERE id = ?").run(
      body.experience_text.slice(0, 2000),
      session.userId,
    );
  }

  const row = db.prepare("SELECT skills, preferred_cities FROM users WHERE id = ?").get(session.userId) as any;
  return NextResponse.json({
    ok: true,
    skills: JSON.parse(row.skills || "[]"),
    preferred_cities: JSON.parse(row.preferred_cities || "[]"),
  });
}
