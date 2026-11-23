import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import EmployerProfile from "@/components/EmployerProfile";
import { getDb } from "@/lib/db";
import { rowToJob } from "@/lib/shortlist";
import { PUBLIC_JOBS_SQL, badgesFor } from "@/lib/verification";

export const dynamic = "force-dynamic";

/** Public page for an employer: what we checked, their open jobs, and Report. */
export default async function EmployerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const user = db.prepare("SELECT id, name, restricted FROM users WHERE id = ? AND role = 'employer'").get(id) as
    | { id: string; name: string; restricted: number }
    | undefined;
  if (!user) notFound();
  const v = db.prepare("SELECT * FROM employer_verifications WHERE employer_id = ?").get(id) as any;
  const jobs = (db.prepare(`${PUBLIC_JOBS_SQL} AND j.employer_id = ? ORDER BY j.created_at DESC`).all(id) as any[]).map(
    rowToJob,
  );
  const badges = badgesFor(v);
  const name = v?.business_name || jobs[0]?.employer_name || user.name;

  return (
    <>
      <Navbar />
      <EmployerProfile
        employerId={id}
        name={name}
        badges={badges}
        restricted={Boolean(user.restricted)}
        jobs={jobs.map((j) => ({ ...j, review_note: "", employer_badges: badges }))}
      />
    </>
  );
}
