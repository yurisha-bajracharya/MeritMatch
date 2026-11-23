"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import JobCard from "@/components/JobCard";
import { useLang } from "@/lib/useLang";
import type { Job, Lang, User } from "@/lib/types";
import { t, localizeDigits } from "@/lib/i18n";
import { x } from "@/lib/i18n-extra";
import { TAG_LABELS, matchJobs } from "@/lib/tags";
import Link from "next/link";
import Icon from "@/components/Icon";
import { CityPicker } from "@/components/CityPicker";
import IdentityVerify from "@/components/IdentityVerify";
import MyJobs from "@/components/MyJobs";
import OrgLink from "@/components/OrgLink";
import MyWorkPhotos from "@/components/MyWorkPhotos";
import TalentPoolCard from "@/components/TalentPoolCard";
import { frameSkill, hasDetail } from "@/lib/skill-details";
import { cityName, locationFit } from "@/lib/places";

type SubData = { id: string; tags: string[]; category: string };

/** Local strings so lib/i18n.ts does not need editing. */
const L = {
  claimed: { en: "Skills you described", ne: "तपाईंले वर्णन गरेका सीप" },
  claimedSub: {
    en: "Used to suggest jobs. Employers you apply to see these marked as described, apart from what your tasks proved.",
    ne: "कामहरू सुझाउन प्रयोग हुन्छ। तपाईंले आवेदन दिएका रोजगारदाताले यी 'वर्णन गरेको' भनेर देख्छन्, कार्यले प्रमाणित गरेको भन्दा छुट्टै।",
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
  const [lang] = useLang();
  const [user, setUser] = useState<User | null>(null);
  const [matchingJobs, setMatchingJobs] = useState<Job[]>([]);
  const [subscriptions, setSubs] = useState<SubData[]>([]);
  const [loading, setLoading] = useState(true);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [citiesSaved, setCitiesSaved] = useState(false);
  const [editingCities, setEditingCities] = useState(false);
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

  const ne = lang === "ne";
  const described = user?.skills ?? [];
  const proven = user?.proven_skills ?? [];
  const chosenCities = cities.filter((c) => c !== "anywhere");
  const steps = [
    {
      done: described.length > 0,
      label: ne ? "आफ्नो अनुभव लेख्नुहोस्" : "Describe your experience",
      href: "/experience-mapper",
    },
    {
      done: cities.length > 0,
      label: ne ? "काम गर्न चाहेको शहर रोज्नुहोस्" : "Choose where you want to work",
      href: "#cities",
    },
    {
      done: proven.length > 0,
      label: ne ? "पहिलो कार्य पूरा गर्नुहोस्" : "Complete your first task",
      href: matchingJobs[0] ? `/t/${matchingJobs[0].id}` : "/jobs",
    },
  ];
  const doneCount = steps.filter((st) => st.done).length;
  const next = steps.find((st) => !st.done);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container-main py-12" aria-busy="true">
          <div className="skeleton h-10 w-72" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
            <div className="skeleton h-64" />
            <div className="skeleton h-64" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container-main py-10">
        <header>
          <h1 className="page-title">{x("welcomeBack", lang, { name: user?.name?.split(" ")[0] || x("there", lang) })}</h1>
          <p className="section-sub">
            {ne ? "छोटो कार्य गरेर आफ्नो सीप देखाउनुहोस्। CV चाहिँदैन।" : "Show what you can do with a short task. No CV needed."}
          </p>
        </header>

        {/* Getting started: only while something is left to do */}
        {next && (
          <section className="mt-8 rounded-lg border border-rule p-6" aria-labelledby="next-step">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="eyebrow">{ne ? `सुरुवात: ${localizeDigits(doneCount, lang)}/३ पूरा` : `Getting started: ${doneCount} of 3 done`}</p>
                <h2 id="next-step" className="mt-2 text-xl font-semibold text-ink">
                  {ne ? "अर्को कदम: " : "Next: "}
                  {next.label}
                </h2>
              </div>
              <Link href={next.href} className="btn-primary">
                {next.label}
                <Icon name="arrow-right" size={18} />
              </Link>
            </div>
            <div className="progress-bar mt-5" role="progressbar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={doneCount}>
              <div className="progress-bar-fill" style={{ width: `${(doneCount / 3) * 100}%` }} />
            </div>
            <ol className="mt-4 grid gap-2 sm:grid-cols-3">
              {steps.map((st) => (
                <li key={st.label} className={`flex items-center gap-2 text-sm ${st.done ? "text-moss" : "text-ink-light"}`}>
                  <Icon name={st.done ? "check-circle" : "clock"} size={18} />
                  {st.label}
                </li>
              ))}
            </ol>
          </section>
        )}

        <MyJobs lang={lang} />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.7fr_1fr] lg:gap-12">
          {/* Main column: jobs */}
          <section aria-labelledby="matches">
            <div className="flex items-end justify-between gap-4 border-b border-rule pb-3">
              <div>
                <h2 id="matches" className="section-title">{t("matchingJobs", lang)}</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {ne
                    ? "तपाईंले भनेका र प्रमाणित सीप, अनि रोजेका शहरका आधारमा।"
                    : "Based on your described and proven skills, and your cities."}
                </p>
              </div>
              <Link href="/jobs" className="link shrink-0 text-sm">
                {t("browseAll", lang)}
              </Link>
            </div>
            <div className="mt-5 space-y-4">
              {matchingJobs.length > 0 ? (
                matchingJobs.slice(0, 6).map((job) => (
                  <JobCard key={job.id} job={job} lang={lang} fit={cities.length ? locationFit(job.location, cities) : undefined} />
                ))
              ) : (
                <div className="empty">
                  <p>{described.length || proven.length ? s("noMatch", lang) : t("noJobs", lang)}</p>
                  <Link href="/jobs" className="btn-secondary btn-sm mt-4">
                    {t("browseAll", lang)}
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Side column: profile facts */}
          <aside className="space-y-10">
            <section aria-labelledby="skills">
              <h2 id="skills" className="text-xl font-semibold text-ink">
                {ne ? "तपाईंका सीप" : "Your skills"}
              </h2>

              <TalentPoolCard lang={lang} />

              <div className="mt-4 rounded-lg border border-dashed border-field/50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base font-semibold text-ink">{s("claimed", lang)}</p>
                  <Link href="/experience-mapper" className="link shrink-0 text-sm">
                    {described.length ? (ne ? "बदल्नुहोस्" : "Edit") : ne ? "थप्नुहोस्" : "Add"}
                  </Link>
                </div>
                <p className="mt-1 text-sm text-ink-light">{s("claimedSub", lang)}</p>
                {described.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {described.map((skill) => (
                      <li key={skill} className="rounded-md border border-rule bg-white px-2.5 py-1 text-sm text-ink-light">
                        {TAG_LABELS[skill]?.[lang] ?? skill}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-ink-muted">{t("noSkillsYet", lang)}</p>
                )}
                {(user?.skill_details ?? []).filter((d) => described.includes(d.tag) && hasDetail(d)).length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-rule pt-3">
                    {(user?.skill_details ?? [])
                      .filter((d) => described.includes(d.tag) && hasDetail(d))
                      .map((d) => (
                        <li key={d.tag} className="text-sm">
                          <span className="font-semibold text-ink">{TAG_LABELS[d.tag]?.[lang] ?? d.tag}: </span>
                          <span className="text-ink-light">{frameSkill(d, lang)}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              <MyWorkPhotos tags={described} lang={lang} />
            </section>

            <section id="cities" aria-labelledby="cities-h" className="scroll-mt-24">
              <div className="flex items-start justify-between gap-3">
                <h2 id="cities-h" className="text-xl font-semibold text-ink">{s("where", lang)}</h2>
                {!editingCities && (
                  <button type="button" className="link shrink-0 text-sm" onClick={() => setEditingCities(true)}>
                    {ne ? "बदल्नुहोस्" : "Change"}
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-light">{s("whereSub", lang)}</p>
              {editingCities ? (
                <div className="mt-4">
                  <CityPicker value={cities} onChange={setCities} lang={lang} />
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await saveCities();
                        setEditingCities(false);
                      }}
                      className="btn-primary btn-sm"
                    >
                      {s("save", lang)}
                    </button>
                    <button type="button" onClick={() => setEditingCities(false)} className="btn-ghost btn-sm">
                      {ne ? "रद्द" : "Cancel"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 flex flex-wrap items-center gap-2 text-base text-ink">
                  <Icon name="pin" size={18} className="text-ink-muted" />
                  {cities.includes("anywhere")
                    ? cityName("anywhere", lang)
                    : chosenCities.length
                      ? chosenCities.map((c) => cityName(c, lang)).join(", ")
                      : ne
                        ? "अहिलेसम्म रोजिएको छैन"
                        : "Not chosen yet"}
                  {citiesSaved && <span className="text-sm text-moss">{s("saved", lang)}</span>}
                </p>
              )}
            </section>

            <IdentityVerify lang={lang} />

            <OrgLink lang={lang} />

            <section aria-labelledby="alerts-h">
              <h2 id="alerts-h" className="text-xl font-semibold text-ink">{t("subscriptions", lang)}</h2>
              <p className="mt-1 text-sm text-ink-light">{t("subscriptionsSub", lang)}</p>
              {subscriptions.length > 0 ? (
                <ul className="mt-3 divide-y divide-rule border-y border-rule">
                  {subscriptions.map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-sm text-ink">
                        {[...sub.tags.map((tag) => TAG_LABELS[tag]?.[lang] ?? tag), sub.category].filter(Boolean).join(", ")}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteSub(sub.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-paper-dark hover:text-danger"
                      >
                        <Icon name="x" size={16} label={x("remove", lang)} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-ink-muted">
                  {t("noSubscriptions", lang)}{" "}
                  {ne ? "काम खोज्दा “सूचना पाउनुहोस्” थिच्नुहोस्।" : "Use “Get alerts” on the jobs page."}
                </p>
              )}
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
