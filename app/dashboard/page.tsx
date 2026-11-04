"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import JobCard from "@/components/JobCard";
import type { Job, Lang, User } from "@/lib/types";
import { t } from "@/lib/i18n";
import { TAG_LABELS } from "@/lib/tags";
import Link from "next/link";

type SubData = { id: string; tags: string[]; category: string };

export default function DashboardPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [user, setUser] = useState<User | null>(null);
  const [matchingJobs, setMatchingJobs] = useState<Job[]>([]);
  const [subscriptions, setSubs] = useState<SubData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "session" }),
      }).then((r) => r.json()),
      fetch("/api/jobs").then((r) => r.json()),
      fetch("/api/subscribe").then((r) => r.json()),
    ]).then(([authData, jobsData, subsData]) => {
      if (!authData.user) {
        router.push("/signup");
        return;
      }
      setUser(authData.user);

      // Filter matching jobs by user's skills
      const allJobs: Job[] = Array.isArray(jobsData) ? jobsData : [];
      const userSkills: string[] = authData.user.skills || [];

      if (userSkills.length > 0) {
        const matched = allJobs.filter((job) =>
          job.tags.some((tag) =>
            userSkills.some(
              (skill) =>
                skill === tag ||
                skill.includes(tag) ||
                tag.includes(skill),
            ),
          ),
        );
        setMatchingJobs(matched.length > 0 ? matched : allJobs.slice(0, 5));
      } else {
        setMatchingJobs(allJobs.slice(0, 5));
      }

      setSubs(Array.isArray(subsData) ? subsData : []);
      setLoading(false);
    }).catch(() => {
      router.push("/signup");
    });
  }, [router]);

  const deleteSub = async (subId: string) => {
    await fetch(`/api/subscribe?id=${subId}`, { method: "DELETE" });
    setSubs((prev) => prev.filter((s) => s.id !== subId));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container-main py-12">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container-main py-8 space-y-8">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">
              {t("candidateDashTitle", lang)}
            </h1>
            <p className="text-sm text-ink-light mt-1">
              Welcome back, {user?.name || "there"}!
            </p>
          </div>
          <button
            onClick={() => setLang(lang === "en" ? "ne" : "en")}
            className="text-sm text-ink-muted hover:text-ink"
          >
            {t("langToggle", lang)}
          </button>
        </div>

        {/* Skills */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{t("yourSkills", lang)}</h2>
            <Link
              href="/experience-mapper"
              className="text-sm text-brand hover:underline"
            >
              {t("experienceMapper", lang)} →
            </Link>
          </div>
          {user?.skills && user.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <span key={skill} className="badge-brand">
                  {TAG_LABELS[skill]?.[lang] ?? skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">{t("noSkillsYet", lang)}</p>
          )}
        </div>

        {/* Matching Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{t("matchingJobs", lang)}</h2>
            <Link href="/jobs" className="text-sm text-brand hover:underline">
              {t("browseAll", lang)} →
            </Link>
          </div>
          {matchingJobs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 stagger-children">
              {matchingJobs.slice(0, 6).map((job) => (
                <JobCard key={job.id} job={job} lang={lang} />
              ))}
            </div>
          ) : (
            <div className="card text-center text-sm text-ink-muted py-8">
              {t("noJobs", lang)}
            </div>
          )}
        </div>

        {/* Subscriptions */}
        <div className="card">
          <h2 className="font-semibold mb-1">{t("subscriptions", lang)}</h2>
          <p className="text-xs text-ink-muted mb-4">{t("subscriptionsSub", lang)}</p>

          {subscriptions.length > 0 ? (
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-paper-dark"
                >
                  <div className="flex flex-wrap gap-1">
                    {sub.tags.map((tag) => (
                      <span key={tag} className="badge-brand text-[10px]">
                        {TAG_LABELS[tag]?.[lang] ?? tag}
                      </span>
                    ))}
                    {sub.category && (
                      <span className="badge-muted text-[10px]">{sub.category}</span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteSub(sub.id)}
                    className="text-xs text-danger hover:underline ml-3"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">{t("noSubscriptions", lang)}</p>
          )}
        </div>
      </div>
    </>
  );
}
