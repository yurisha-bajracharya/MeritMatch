"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import TaskFlow from "@/components/TaskFlow";

export default function TaskPage() {
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(
            d.code === "not_open"
              ? "This job is not open for applications right now. It may be waiting for review or temporarily hidden."
              : "Job not found",
          );
        }
        return r.json();
      })
      .then(setJob)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container-main py-12 text-center">
          <div className="empty mx-auto max-w-md">
            <p className="text-base text-ink">{error}</p>
            <a href="/jobs" className="btn-secondary btn-sm mt-4">
              Browse open jobs
            </a>
          </div>
        </div>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <Navbar />
        <div className="container-main py-12">
          <div className="skeleton h-64 rounded-xl max-w-2xl mx-auto" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container-main py-10 max-w-2xl mx-auto">
        <TaskFlow
          jobId={job.id}
          jobTitle={job.title}
          employerName={job.employer_name}
          durationMin={job.duration_min}
          scenarios={job.template?.scenarios ?? []}
          rubric={job.template?.rubric ?? []}
          customQuestions={job.custom_questions ?? []}
          aiScoring={job.ai_scoring}
          mcq={job.template?.mcq ?? []}
          evidence={job.evidence ?? "none"}
          details={job}
        />
      </div>
    </>
  );
}
