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
      .then((r) => {
        if (!r.ok) throw new Error("Job not found");
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
          <div className="card max-w-md mx-auto">
            <p className="text-sm text-danger">{error}</p>
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
      <div className="container-main py-8 max-w-2xl mx-auto">
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
        />
      </div>
    </>
  );
}
