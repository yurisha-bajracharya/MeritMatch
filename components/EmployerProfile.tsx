"use client";

import JobCard from "./JobCard";
import ReportButton from "./ReportButton";
import VerificationBadges from "./VerificationBadges";
import { useLang } from "@/lib/useLang";
import type { EmployerBadges, Job } from "@/lib/types";

export default function EmployerProfile({
  employerId,
  name,
  badges,
  restricted,
  jobs,
}: {
  employerId: string;
  name: string;
  badges: EmployerBadges;
  restricted: boolean;
  jobs: Job[];
}) {
  const [lang] = useLang();
  const ne = lang === "ne";
  const none = !badges.contact && !badges.documents && !badges.employer;

  return (
    <main className="container-main max-w-4xl py-10">
      <p className="eyebrow">{ne ? "रोजगारदाता" : "Employer"}</p>
      <h1 className="page-title mt-2">{name}</h1>

      <section className="mt-6" aria-label={ne ? "प्रमाणीकरण" : "Verification"}>
        {none ? (
          <p className="text-base text-ink-light">
            {ne ? "मेरिटम्याचले यो रोजगारदाताको प्रमाणीकरण अझै पूरा गरेको छैन।" : "MeritMatch has not finished verifying this employer yet."}
          </p>
        ) : (
          <VerificationBadges badges={badges} lang={lang} size="md" />
        )}
        <p className="mt-3 max-w-2xl text-sm text-ink-muted">
          {ne
            ? "प्रमाणीकरणले जोखिम घटाउँछ, हटाउँदैन। मेरिटम्याच वा सरकारले कुनै रोजगारदाताको ग्यारेन्टी गर्दैन। केही गलत लागे रिपोर्ट गर्नुहोस्।"
            : "Verification reduces risk; it does not remove it. Neither MeritMatch nor the government guarantees any employer. If something feels wrong, report it."}
        </p>
      </section>

      <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-rule py-3">
        <ReportButton employerId={employerId} about={name} lang={lang} variant="button" />
        <span className="text-sm text-ink-muted">
          {ne ? "आवेदकले कहिल्यै पैसा तिर्नु पर्दैन।" : "Applicants never have to pay to apply."}
        </span>
      </div>

      {restricted && (
        <div className="alert-note mt-6">
          {ne
            ? "यो रोजगारदाताका कामहरू समीक्षाका क्रममा अस्थायी रूपमा लुकाइएका छन्।"
            : "This employer's jobs are temporarily hidden while a review takes place."}
        </div>
      )}

      <h2 className="section-title mt-10">{ne ? "खुला कामहरू" : "Open jobs"}</h2>
      <div className="mt-4 space-y-4">
        {jobs.length ? (
          jobs.map((j) => <JobCard key={j.id} job={j} lang={lang} />)
        ) : (
          <div className="empty">{ne ? "अहिले कुनै खुला काम छैन।" : "No open jobs right now."}</div>
        )}
      </div>
    </main>
  );
}
