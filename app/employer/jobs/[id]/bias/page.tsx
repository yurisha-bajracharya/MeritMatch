import { computeBias } from "@/lib/bias";
import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { BiasDashboardWithStats } from "@/components/BiasDashboard";
import Link from "next/link";
import Icon from "@/components/Icon";

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">{job.title}</h1>
            <p className="text-sm text-ink-light">{job.employer_name}</p>
          </div>
          <Link
            href={`/employer/jobs/${id}`}
            className="btn-secondary btn-sm"
          >
            <span className="inline-flex items-center gap-1">
              <Icon name="chevron" size={14} className="rotate-180" />
              Back to Rankings
            </span>
          </Link>
        </div>

        <BiasDashboardWithStats stats={stats} />
      </div>
    </>
  );
}
