import { NextResponse } from "next/server";
import { loginOrCreate, setSessionCookie, clearSession, getSession } from "@/lib/auth";
import type { Role } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "logout") {
      await clearSession();
      return NextResponse.json({ ok: true });
    }

    if (action === "session") {
      const session = await getSession();
      if (!session) return NextResponse.json({ user: null });
      const { getDb } = await import("@/lib/db");
      const db = getDb();
      const row = db.prepare("SELECT * FROM users WHERE id = ?").get(session.userId) as any;
      if (!row) return NextResponse.json({ user: null });

      // Skills the person has actually DEMONSTRATED: tags earned on scored
      // work tasks. Candidates are linked to users by phone number.
      const provenRows = db
        .prepare(
          `SELECT s.tags FROM submissions s
             JOIN candidates c ON c.id = s.candidate_id
            WHERE c.phone = ?`,
        )
        .all(row.phone) as { tags: string }[];
      const proven = [
        ...new Set(provenRows.flatMap((r) => JSON.parse(r.tags || "[]"))),
      ];

      return NextResponse.json({
        user: {
          id: row.id,
          name: row.name,
          phone: row.phone,
          email: row.email || "",
          role: row.role,
          gender: row.gender || "",
          region: row.region || "",
          skills: JSON.parse(row.skills || "[]"),
          proven_skills: proven,
          preferred_cities: JSON.parse(row.preferred_cities || "[]"),
          experience_text: row.experience_text || "",
          created_at: row.created_at,
        },
      });
    }

    // Login or signup
    const { name, phone, email, role, gender, region, skills, preferred_cities, experience_text } = body;
    if (!phone || !role) {
      return NextResponse.json({ error: "Phone and role are required" }, { status: 400 });
    }

    const user = await loginOrCreate({
      name: name || "",
      phone: String(phone).trim(),
      email,
      role: role as Role,
      gender,
      region,
      skills,
      preferred_cities,
      experience_text,
    });

    await setSessionCookie(user.id, user.role);

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Auth failed" },
      { status: 500 },
    );
  }
}
