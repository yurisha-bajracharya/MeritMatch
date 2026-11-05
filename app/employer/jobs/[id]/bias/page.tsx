import { computeBias } from "@/lib/bias";
import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { BiasDashboardWithStats, BiasHeader } from "@/components/BiasDashboard";

export default async function BiasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const db = getDb();
  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as any;
  if (!job) notFound();

  const stats = computeBias(id);

  return (
    <>
      <Navbar />
      <div className="container-main py-8 max-w-2xl mx-auto space-y-6">
        <BiasHeader jobId={id} title={job.title} employer={job.employer_name} />

        <BiasDashboardWithStats stats={stats} />
      </div>
    </>
  );
}
