import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import EmployerJobs from "@/components/EmployerJobs";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EmployerDashboardPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "employer") redirect("/signup");

  const jobs = getDb()
    .prepare(
      `SELECT j.id, j.title, j.location, j.created_at,
              COUNT(s.id) AS applicants,
              COALESCE(SUM(s.shortlisted), 0) AS shortlisted,
              COALESCE(SUM(s.rejected), 0) AS rejected
         FROM jobs j LEFT JOIN submissions s ON s.job_id = j.id
        WHERE j.employer_id = ?
        GROUP BY j.id ORDER BY j.created_at DESC`,
    )
    .all(user.id) as any[];

  return (
    <>
      <Navbar />
      <EmployerJobs name={user.name} jobs={jobs} />
    </>
  );
}
