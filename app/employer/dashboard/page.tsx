import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import EmployerJobs from "@/components/EmployerJobs";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { badgesFor, getVerification } from "@/lib/verification";

export const dynamic = "force-dynamic";

export default async function EmployerDashboardPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "employer") redirect("/signup");

  const jobs = getDb()
    .prepare(
      `SELECT j.id, j.title, j.location, j.created_at, j.review_status, j.review_note,
              COUNT(s.id) AS applicants,
              COALESCE(SUM(s.shortlisted), 0) AS shortlisted,
              COALESCE(SUM(s.rejected), 0) AS rejected
         FROM jobs j LEFT JOIN submissions s ON s.job_id = j.id
        WHERE j.employer_id = ?
        GROUP BY j.id ORDER BY j.created_at DESC`,
    )
    .all(user.id) as any[];

  const v = getVerification(user.id);
  const b = badgesFor(v);
  const verification = {
    contact: b.contact,
    business: v.business_status,
    presence: v.presence_status,
    employer: b.employer,
    restricted: Boolean((getDb().prepare("SELECT restricted FROM users WHERE id = ?").get(user.id) as any)?.restricted),
  };

  return (
    <>
      <Navbar />
      <EmployerJobs
        name={user.name}
        jobs={jobs}
        verification={verification}
        hires={(getDb().prepare("SELECT COUNT(*) AS n FROM hires WHERE employer_id = ?").get(user.id) as { n: number }).n}
        checkinsDue={
          (
            getDb()
              .prepare(
                "SELECT COUNT(*) AS n FROM checkins c JOIN hires h ON h.id = c.hire_id WHERE h.employer_id = ? AND c.respondent = 'employer' AND c.answered_at = '' AND c.due_at <= ? AND h.status = 'active'",
              )
              .get(user.id, new Date().toISOString()) as { n: number }
          ).n
        }
      />
    </>
  );
}
