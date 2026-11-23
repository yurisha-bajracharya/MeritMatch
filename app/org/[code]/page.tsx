"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Stat from "@/components/Stat";
import { useLang } from "@/lib/useLang";
import { localizeDigits } from "@/lib/i18n";
import { TAG_LABELS } from "@/lib/tags";
import { downloadCsv } from "@/lib/csv";
import { formatDate } from "@/lib/dates";

type Person = {
  name: string;
  tasks: number;
  average_score: number | null;
  shortlisted: boolean;
  interviewed: boolean;
  hired: boolean;
  position: string;
  start_date: string;
  summary: { employed_90: boolean | null; formal: boolean; letter_confirmed_by_worker: boolean; ssf_confirmed_by_worker: boolean } | null;
};
type Data = {
  org: { name: string; kind: string; code: string };
  trainees: number;
  funnel: { took_a_task: number; shortlisted: number; interviewed: number; hired: number };
  average_task_score: number | null;
  top_skills: { tag: string; count: number }[];
  outcomes: { hires: number; with_90_day_answer: number; retained_90: number; retention_90_pct: number | null; letter_confirmed: number; ssf_confirmed: number; formal: number; formal_job_rate_pct: number | null };
  people: Person[];
  generated_at: string;
};

function Inner() {
  const { code } = useParams() as { code: string };
  const k = useSearchParams().get("k") ?? "";
  const [lang] = useLang();
  const ne = lang === "ne";
  const [d, setD] = useState<Data | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    fetch(`/api/org/${encodeURIComponent(code)}?k=${encodeURIComponent(k)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setD)
      .catch(() => setMissing(true));
  }, [code, k]);

  const n = (v: number) => localizeDigits(v, lang);
  const pct = (v: number | null) => (v === null ? "–" : `${n(v)}%`);
  if (missing) return <div className="empty">{ne ? "यो पृष्ठ खोल्न पूरा लिंक चाहिन्छ।" : "This page needs the organisation's full private link."}</div>;
  if (!d) return <div className="skeleton h-96" />;

  const steps = [
    [ne ? "तालिम लिएका (सहमति दिएका)" : "Trainees (consented)", d.trainees],
    [ne ? "कार्य गरेर सीप देखाएका" : "Took a work task", d.funnel.took_a_task],
    [ne ? "छनौटमा परेका" : "Shortlisted", d.funnel.shortlisted],
    [ne ? "अन्तर्वार्तामा बोलाइएका" : "Invited to interview", d.funnel.interviewed],
    [ne ? "नियुक्त" : "Hired", d.funnel.hired],
    [ne ? "९० दिनमा काम जारी" : "Still employed at 90 days", d.outcomes.retained_90],
    [ne ? "औपचारिक रोजगारी (नियुक्तिपत्र + SSF)" : "In a formal job (letter + SSF)", d.outcomes.formal],
  ] as const;
  const max = Math.max(1, d.trainees);
  const referral = typeof window !== "undefined" ? `${window.location.origin}/signup?org=${d.org.code}` : "";

  const csv = () =>
    downloadCsv(`${d.org.code}-outcomes-${d.generated_at.slice(0, 10)}.csv`, [
      ["Indicator", "Value"],
      ["Trainees (consented)", d.trainees],
      ["Took a work task", d.funnel.took_a_task],
      ["Average task score", d.average_task_score ?? ""],
      ["Shortlisted", d.funnel.shortlisted],
      ["Invited to interview", d.funnel.interviewed],
      ["Hired", d.funnel.hired],
      ["Reached 90 days", d.outcomes.with_90_day_answer],
      ["Still employed at 90 days", d.outcomes.retained_90],
      ["Retention at 90 days (%)", d.outcomes.retention_90_pct ?? ""],
      ["Appointment letter (worker-confirmed)", d.outcomes.letter_confirmed],
      ["SSF enrolled (worker-confirmed)", d.outcomes.ssf_confirmed],
      ["Formal jobs (letter + SSF)", d.outcomes.formal],
      ["Formal Job Rate (% of hires)", d.outcomes.formal_job_rate_pct ?? ""],
      [],
      ["Trainee", "Tasks", "Average score", "Shortlisted", "Hired", "Position", "Employed at 90 days", "Formal job"],
      ...d.people.map((p) => [p.name, p.tasks, p.average_score ?? "", p.shortlisted ? "yes" : "no", p.hired ? "yes" : "no", p.position, p.summary?.employed_90 ?? "", p.summary?.formal ? "yes" : "no"]),
    ]);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{ne ? "तालिमको नतिजा प्रतिवेदन" : "Training outcomes report"}</p>
          <h1 className="page-title mt-2">{d.org.name}</h1>
          <p className="section-sub">
            {ne ? "तयार गरिएको " : "Prepared "}
            {formatDate(d.generated_at, lang)}
            {ne ? " · मेरिटम्याच" : " · from MeritMatch"}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button type="button" className="btn-secondary btn-sm" onClick={csv}>
            {ne ? "CSV डाउनलोड" : "Download CSV"}
          </button>
          <button type="button" className="btn-primary btn-sm" onClick={() => window.print()}>
            {ne ? "प्रिन्ट / PDF" : "Print / PDF"}
          </button>
        </div>
      </header>

      <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat value={n(d.funnel.hired)} label={ne ? "नियुक्त भएका तालिमार्थी" : "Trainees hired"} hint={ne ? `${n(d.trainees)} मध्ये` : `of ${d.trainees} trainees`} />
        <Stat value={pct(d.outcomes.retention_90_pct)} label={ne ? "९० दिनमा काम जारी" : "Still employed at 90 days"} hint={ne ? `${n(d.outcomes.with_90_day_answer)} जनाको ९० दिन पुगेको` : `of ${d.outcomes.with_90_day_answer} who reached 90 days`} />
        <Stat value={pct(d.outcomes.formal_job_rate_pct)} label={ne ? "औपचारिक रोजगारी दर" : "Formal Job Rate"} hint={ne ? "नियुक्तिपत्र + SSF, कामदारले पुष्टि गरेको" : "Letter + SSF, confirmed by the worker"} />
        <Stat value={d.average_task_score === null ? "–" : `${n(d.average_task_score)}%`} label={ne ? "औसत कार्य अंक" : "Average task score"} hint={ne ? "बेनामी जाँचबाट" : "from blind work tasks"} />
      </section>

      <section className="mt-10" aria-labelledby="funnel-h">
        <h2 id="funnel-h" className="section-title">{ne ? "तालिमदेखि औपचारिक रोजगारीसम्म" : "From training to a formal job"}</h2>
        <ol className="mt-4 space-y-2.5">
          {steps.map(([label, v]) => (
            <li key={label} className="grid grid-cols-[minmax(0,12rem)_1fr_3rem] items-center gap-3 text-sm sm:grid-cols-[16rem_1fr_3rem]">
              <span className="text-ink-light">{label}</span>
              <span className="h-3 rounded-full bg-sunken" aria-hidden>
                <span className="block h-3 rounded-full bg-brand" style={{ width: `${(v / max) * 100}%` }} />
              </span>
              <span className="text-right font-semibold">{n(v)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="section-title">{ne ? "दाता र SWC प्रतिवेदनका लागि सूचक" : "Indicators for donor and SWC reports"}</h2>
          <table className="mt-3 w-full text-left text-sm">
            <tbody className="divide-y divide-rule border-y border-rule">
              {[
                [ne ? "उत्पादन" : "Output", ne ? "कामको कार्यमा मूल्याङ्कन भएका तालिमार्थी" : "Trainees assessed on a real work task", n(d.funnel.took_a_task)],
                [ne ? "उत्पादन" : "Output", ne ? "रोजगारदाताको छनौटमा परेका" : "Trainees shortlisted by employers", n(d.funnel.shortlisted)],
                [ne ? "नतिजा" : "Outcome", ne ? "रोजगारी पाएका" : "Trainees employed", n(d.funnel.hired)],
                [ne ? "नतिजा" : "Outcome", ne ? "९० दिनसम्म काम टिकाएका" : "Employed for 90+ days", `${n(d.outcomes.retained_90)} (${pct(d.outcomes.retention_90_pct)})`],
                [ne ? "नतिजा" : "Outcome", ne ? "लिखित नियुक्तिपत्र पाएका" : "With a written appointment letter", n(d.outcomes.letter_confirmed)],
                [ne ? "नतिजा" : "Outcome", ne ? "SSF मा दर्ता भएका" : "Enrolled in the Social Security Fund", n(d.outcomes.ssf_confirmed)],
                [ne ? "नतिजा" : "Outcome", ne ? "औपचारिक रोजगारीमा" : "In formal employment", `${n(d.outcomes.formal)} (${pct(d.outcomes.formal_job_rate_pct)})`],
              ].map(([kind, label, v], i) => (
                <tr key={i}>
                  <td className="py-2 pr-3 text-ink-muted">{kind}</td>
                  <td className="py-2 pr-3">{label}</td>
                  <td className="py-2 text-right font-semibold">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="section-title">{ne ? "कार्यमा सबैभन्दा धेरै देखिएका सीप" : "Skills shown most in tasks"}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {d.top_skills.map((s) => (
              <li key={s.tag} className="badge-moss !text-sm">
                {TAG_LABELS[s.tag]?.[lang] ?? s.tag} · {n(s.count)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink-muted">
            {ne ? "कार्यमा १० मा ६ वा बढी पाएका सीप, जति पटक देखाइयो।" : "Skills scored 6/10 or higher on tasks, by how often they were shown."}
          </p>
          <div className="mt-6 rounded-lg bg-paper-dark p-4 print:hidden">
            <p className="text-sm font-semibold">{ne ? "तालिमार्थीलाई यो लिंक दिनुहोस्" : "Share this sign-up link with trainees"}</p>
            <p className="mt-1 break-all font-mono text-sm">{referral}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {ne ? "उनीहरूले सहमति दिएपछि मात्र यहाँ गनिन्छन्।" : "They are only counted here after they agree to share their outcomes."}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="section-title">{ne ? "तालिमार्थी" : "Trainees"}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink/20 text-ink-muted">
              <tr>
                {[ne ? "नाम" : "Name", ne ? "कार्य" : "Tasks", ne ? "औसत अंक" : "Avg score", ne ? "स्थिति" : "Status", ne ? "९० दिन" : "90 days", ne ? "औपचारिक" : "Formal"].map((h) => (
                  <th key={h} className="py-2 pr-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {d.people.map((p, i) => (
                <tr key={i}>
                  <td className="py-2.5 pr-4 font-medium">{p.name}</td>
                  <td className="py-2.5 pr-4">{n(p.tasks)}</td>
                  <td className="py-2.5 pr-4">{p.average_score === null ? "–" : `${n(p.average_score)}%`}</td>
                  <td className="py-2.5 pr-4">
                    {p.hired ? `${ne ? "नियुक्त" : "Hired"}: ${p.position}` : p.interviewed ? (ne ? "अन्तर्वार्ता" : "Interview") : p.shortlisted ? (ne ? "छनौट" : "Shortlisted") : p.tasks ? (ne ? "आवेदन दिएको" : "Applied") : ne ? "सुरु भएको छैन" : "Not started"}
                  </td>
                  <td className="py-2.5 pr-4">{p.summary?.employed_90 === null || !p.summary ? "–" : p.summary.employed_90 ? "✓" : "✗"}</td>
                  <td className="py-2.5 pr-4">{p.summary?.formal ? "✓" : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-8 text-sm text-ink-muted">
        {ne
          ? "केवल सहमति दिएका तालिमार्थी गनिन्छन्। उनीहरूका उत्तर र तलबबारेको प्रतिक्रिया देखाइँदैन। औपचारिक रोजगारी कामदार आफैंले चेक-इनमा पुष्टि गरेको आधारमा हो। सानो सङ्ख्यामा प्रतिशत होसियारीपूर्वक पढ्नुहोस्।"
          : "Only trainees who agreed are counted. Their answers and pay feedback are never shown. Formal employment is based on the worker's own check-in answers. Read percentages with care when numbers are small."}
      </p>
    </>
  );
}

export default function OrgPage() {
  return (
    <>
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="container-main max-w-5xl py-10 print:py-0">
        <Suspense fallback={null}>
          <Inner />
        </Suspense>
      </main>
    </>
  );
}
