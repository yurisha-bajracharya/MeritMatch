"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import JobCard from "@/components/JobCard";
import { useLang } from "@/lib/useLang";
import type { Job, Lang, User } from "@/lib/types";
import { t } from "@/lib/i18n";
import { x } from "@/lib/i18n-extra";
import { TAG_LABELS, matchJobs } from "@/lib/tags";
import Link from "next/link";
import Icon from "@/components/Icon";
import { CityPicker } from "@/components/CityPicker";
import { locationFit } from "@/lib/places";

type SubData = { id: string; tags: string[]; category: string };

/** Local strings so lib/i18n.ts does not need editing. */
const L = {
  proven: { en: "Proven by your work", ne: "तपाईंको कामले प्रमाणित" },
  provenSub: {
    en: "Skills you showed by scoring well on a job's task.",
    ne: "कुनै कामको कार्यमा राम्रो अंक ल्याएर देखाएका सीप।",
  },
  noneProven: {
    en: "Nothing proven yet. Apply to a job below and do its short task. Good work shows up here.",
    ne: "अहिलेसम्म केही प्रमाणित भएको छैन। तल कुनै कामका लागि आवेदन दिई सानो कार्य गर्नुहोस्।",
  },
  claimed: { en: "Skills you described", ne: "तपाईंले वर्णन गरेका सीप" },
  claimedSub: {
    en: "Used to suggest jobs. Employers never see these, only your task results.",
    ne: "कामहरू सुझाउन प्रयोग हुन्छ। रोजगारदाताले यी देख्दैनन्, तपाईंको कार्य नतिजा मात्र देख्छन्।",
  },
  where: { en: "Where you want to work", ne: "तपाईं कहाँ काम गर्न चाहनुहुन्छ" },
  whereSub: {
    en: "Jobs in these cities are shown first, and you only get alerts for jobs here.",
    ne: "यी शहरका काम पहिले देखिन्छन्, र सूचना पनि यहीँका कामको मात्र आउँछ।",
  },
  save: { en: "Save", ne: "सुरक्षित गर्नुहोस्" },
  saved: { en: "Saved", ne: "सुरक्षित भयो" },
  noMatch: {
    en: "No open jobs match your skills yet. Turn on alerts and we'll tell you when one appears.",
    ne: "तपाईंका सीपसँग मिल्ने खुला काम अहिले छैन। सूचना खोल्नुहोस्, आएपछि खबर गर्छौं।",
  },
} as const;
const s = (k: keyof typeof L, lang: Lang) => L[k][lang];

export default function DashboardPage() {
  const [lang, setLang] = useLang();
  const [user, setUser] = useState<User | null>(null);
  const [matchingJobs, setMatchingJobs] = useState<Job[]>([]);
  const [subscriptions, setSubs] = useState<SubData[]>([]);
  const [loading, setLoading] = useState(true);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [citiesSaved, setCitiesSaved] = useState(false);
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
      if (authData.user.role === "employer") {
        router.push("/employer/dashboard");
        return;
      }
      setUser(authData.user);
      setCities(authData.user.preferred_cities || []);

      // Rank jobs with the same fuzzy matcher the jobs page, Experience
      // Mapper and notifier use, so "sales" still matches "customer-service".
      // Claimed and proven skills both count for SUGGESTING jobs; neither
      // affects how an employer ranks the candidate.
      const jobList: Job[] = Array.isArray(jobsData) ? jobsData : [];
      setAllJobs(jobList);
      const userSkills: string[] = [
        ...new Set([
          ...(authData.user.skills || []),
          ...(authData.user.proven_skills || []),
        ]),
      ];

      if (userSkills.length > 0) {
        // Only real matches. The old code padded with unrelated jobs when
        // nothing matched, which made the recommendations look broken.
        setMatchingJobs(
          matchJobs(userSkills, jobList, [], 6, {
            cities: authData.user.preferred_cities || [],
          }).map((m) => m.job),
        );
      } else {
        setMatchingJobs(jobList.slice(0, 6));
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

  const saveCities = async () => {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferred_cities: cities }),
    });
    if (!res.ok || !user) return;
    // Re-rank the suggestions with the new cities straight away.
    const skills = [...new Set([...(user.skills || []), ...(user.proven_skills || [])])];
    if (skills.length > 0) {
      setMatchingJobs(matchJobs(skills, allJobs, [], 6, { cities }).map((m) => m.job));
    }
    setCitiesSaved(true);
    setTimeout(() => setCitiesSaved(false), 2000);
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
              {x("welcomeBack", lang, { name: user?.name || x("there", lang) })}
            </p>
          </div>
          <button
            onClick={() => setLang(lang === "en" ? "ne" : "en")}
            className="text-sm text-ink-muted hover:text-ink"
          >
            {t("langToggle", lang)}
          </button>
        </div>

        {/* Skills: proven (earned) vs claimed (described) */}
        <div className="card space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-moss" />
              <h2 className="font-semibold">{s("proven", lang)}</h2>
            </div>
            <p className="text-xs text-ink-muted mt-0.5 mb-3">
              {s("provenSub", lang)}
            </p>
            {user?.proven_skills && user.proven_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.proven_skills.map((skill) => (
                  <span key={skill} className="badge-moss">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="check" size={12} strokeWidth={2.5} />
                      {TAG_LABELS[skill]?.[lang] ?? skill}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">{s("noneProven", lang)}</p>
            )}
          </div>

          <div className="divider pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full border border-ink-muted" />
                <h2 className="font-semibold">{s("claimed", lang)}</h2>
              </div>
              <Link
                href="/experience-mapper"
                className="text-sm text-brand hover:underline inline-flex items-center gap-0.5"
              >
                {t("experienceMapper", lang)}
                <Icon name="chevron" size={14} />
              </Link>
            </div>
            <p className="text-xs text-ink-muted mt-0.5 mb-3">
              {s("claimedSub", lang)}
            </p>
            {user?.skills && user.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill) => (
                  <span key={skill} className="badge-muted">
                    {TAG_LABELS[skill]?.[lang] ?? skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">{t("noSkillsYet", lang)}</p>
            )}
          </div>
        </div>

        {/* Preferred cities */}
        <div className="card">
          <div className="flex items-center gap-2">
            <Icon name="pin" size={16} className="text-brand" />
            <h2 className="font-semibold">{s("where", lang)}</h2>
          </div>
          <p className="text-xs text-ink-muted mt-0.5 mb-3">{s("whereSub", lang)}</p>
          <CityPicker value={cities} onChange={setCities} lang={lang} />
          <button onClick={saveCities} className="btn-primary btn-sm mt-4">
            {citiesSaved ? s("saved", lang) : s("save", lang)}
          </button>
        </div>

        {/* Matching Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{t("matchingJobs", lang)}</h2>
            <Link href="/jobs" className="text-sm text-brand hover:underline inline-flex items-center gap-0.5">
              {t("browseAll", lang)}
              <Icon name="chevron" size={14} />
            </Link>
          </div>
          {matchingJobs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 stagger-children">
              {matchingJobs.slice(0, 6).map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  lang={lang}
                  fit={cities.length ? locationFit(job.location, cities) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center text-sm text-ink-muted py-8">
              {user?.skills?.length || user?.proven_skills?.length
                ? s("noMatch", lang)
                : t("noJobs", lang)}
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
                    <Icon name="x" size={14} label={x("remove", lang)} />
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
