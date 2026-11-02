import { notFound } from "next/navigation";
import TaskFlow from "@/components/TaskFlow";
import { readDb } from "@/lib/store";
import { getTemplate, toPublicTemplate } from "@/lib/templates";

export const dynamic = "force-dynamic";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = (await readDb()).jobs.find((j) => j.id === id);
  if (!job) notFound();
  return (
    <TaskFlow
      job={job}
      template={toPublicTemplate(getTemplate(job.category))}
    />
  );
}
