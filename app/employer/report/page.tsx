"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Stat from "@/components/Stat";
import Icon from "@/components/Icon";
import { useLang } from "@/lib/useLang";
import { downloadCsv } from "@/lib/csv";
import { formatDate } from "@/lib/dates";
import { localizeDigits } from "@/lib/i18n";
import { PERIOD_LABEL } from "@/lib/job-format";

type Summary = {
  letter_issued: boolean;
  letter_confirmed_by_worker: boolean;
  ssf_reported_by_employer: boolean;
  ssf_confirmed_by_worker: boolean;
  ssf_deadline: string;
  ssf_overdue: boolean;
  employed_30: boolean | null;
  employed_60: boolean | null;
  employed_90: boolean | null;
  formal: boolean;
};
type Report = {
  business: { name: string; contact_verified: boolean; business_status: string; presence_status: string; employer_verified: boolean };
  totals: { hires: number; with_90_day_answer: number; retained_90: number; retention_90_pct: number | null; letter_confirmed: number; ssf_confirmed: number; formal: number; formal_job_rate_pct: number | null };
  hires: { id: string; worker_name: string; position: string; start_date: string; salary: number; salary_period: "month" | "day" | "hour"; status: string; summary: Summary }[];
  generated_at: string;
};

export default function EmployerReportPage() {
  const [lang] = useLang();
  const ne = lang === "ne";
  const [r, setR] = useState<Report | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  useEffect(() => {
    fetch("/api/employer/report")
      .then((res) => (res.status === 401 ? (setNeedLogin(true), null) : res.json()))
      .then((d) => d && setR(d))
      .catch(() => {});
  }, []);
  const n = (v: number) => localizeDigits(v, lang);
  const pct = (v: number | null) => (v === null ? "–" : `${n(v)}%`);
  const d = (iso: string) => formatDate(iso, lang, true);
  const yes = (v: boolean | null) => (v === null ? "–" : v ? (ne ? "हो" : "Yes") : ne ? "होइन" : "No");
  const layer = (s: string) => ({ approved: ne ? "हेरिएको" : "Reviewed", submitted: ne ? "समीक्षामा" : "In review", needs_info: ne ? "थप चाहिन्छ" : "More info needed", rejected: ne ? "स्वीकार भएन" : "Not accepted", none: ne ? "बाँकी" : "Not started" })[s] ?? s;

  const csv = () =>
    r &&
    downloadCsv(`meritmatch-workforce-report-${r.generated_at.slice(0, 10)}.csv`, [
      ["Worker", "Position", "Start date", "Salary", "Per", "Letter issued", "Letter confirmed by worker", "SSF reported by employer", "SSF confirmed by worker", "SSF deadline", "Employed day 30", "Employed day 60", "Employed day 90", "Formal job", "Status"],
      ...r.hires.map((h) => [
        h.worker_name, h.position, h.start_date.slice(0, 10), h.salary, h.salary_period,
        h.summary.letter_issued ? "yes" : "no", h.summary.letter_confirmed_by_worker ? "yes" : "no",
        h.summary.ssf_reported_by_employer ? "yes" : "no", h.summary.ssf_confirmed_by_worker ? "yes" : "no", h.summary.ssf_deadline.slice(0, 10),
        h.summary.employed_30 ?? "", h.summary.employed_60 ?? "", h.summary.employed_90 ?? "", h.summary.formal ? "yes" : "no", h.status,
      ]),
    ]);

  return (
    <>
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="container-main max-w-5xl py-10 print:py-0">
        {needLogin ? (
          <div className="empty">{ne ? "रोजगारदाताको रूपमा लग इन गर्नुहोस्।" : "Log in as an employer."}</div>
        ) : !r ? (
          <div className="skeleton h-96" />
        ) : (
          <>
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{ne ? "औपचारिक रोजगारी प्रतिवेदन" : "Workforce and formalisation report"}</p>
                <h1 className="page-title mt-2">{r.business.name || (ne ? "तपाईंको व्यवसाय" : "Your business")}</h1>
                <p className="section-sub">
                  {ne ? "मेरिटम्याचबाट गरिएका नियुक्ति। तयार गरिएको " : "Hires made through MeritMatch. Prepared "}
                  {d(r.generated_at)}
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
              <Stat value={n(r.totals.hires)} label={ne ? "जम्मा नियुक्ति" : "Hires"} />
              <Stat value={pct(r.totals.retention_90_pct)} label={ne ? "९० दिनमा काम जारी" : "Still employed at 90 days"} hint={ne ? `${n(r.totals.with_90_day_answer)} जनाको ९० दिन पुगेको` : `of ${r.totals.with_90_day_answer} who reached 90 days`} />
              <Stat value={pct(r.totals.formal_job_rate_pct)} label={ne ? "औपचारिक रोजगारी दर" : "Formal Job Rate"} hint={ne ? "नियुक्तिपत्र + SSF, कामदारले पुष्टि गरेको" : "Letter + SSF, confirmed by the worker"} />
              <Stat value={`${n(r.totals.ssf_confirmed)}/${n(r.totals.hires)}`} label={ne ? "SSF दर्ता (कामदारको पुष्टि)" : "SSF enrolled (worker-confirmed)"} />
            </section>

            <section className="mt-10">
              <h2 className="section-title">{ne ? "व्यवसायको औपचारिकता" : "Business formality"}</h2>
              <dl className="mt-3 grid gap-x-8 gap-y-2 text-base sm:grid-cols-2">
                <div className="flex justify-between gap-4 border-b border-rule py-2"><dt className="text-ink-light">{ne ? "सम्पर्क प्रमाणित" : "Contact verified"}</dt><dd>{yes(r.business.contact_verified)}</dd></div>
                <div className="flex justify-between gap-4 border-b border-rule py-2"><dt className="text-ink-light">{ne ? "दर्ता / प्यान कागजात" : "Registration / PAN documents"}</dt><dd>{layer(r.business.business_status)}</dd></div>
                <div className="flex justify-between gap-4 border-b border-rule py-2"><dt className="text-ink-light">{ne ? "व्यवसायको उपस्थिति" : "Business presence"}</dt><dd>{layer(r.business.presence_status)}</dd></div>
                <div className="flex justify-between gap-4 border-b border-rule py-2"><dt className="text-ink-light">{ne ? "रोजगारदाता प्रमाणित" : "Employer Verified"}</dt><dd>{yes(r.business.employer_verified)}</dd></div>
              </dl>
              {!r.business.employer_verified && (
                <Link href="/employer/verify" className="link mt-3 inline-block text-sm print:hidden">
                  {ne ? "प्रमाणीकरण पूरा गर्नुहोस्" : "Finish verification"}
                </Link>
              )}
            </section>

            <section className="mt-10">
              <h2 className="section-title">{ne ? "हरेक नियुक्ति" : "Each hire"}</h2>
              {r.hires.length === 0 ? (
                <div className="empty mt-3">{ne ? "अहिलेसम्म कुनै नियुक्ति छैन। आवेदकको सूचीबाट “नियुक्त गरियो” थिच्नुहोस्।" : "No hires yet. Use “Mark as hired” on an applicant."}</div>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-ink/20 text-ink-muted">
                      <tr>
                        {[ne ? "कामदार / पद" : "Worker / position", ne ? "सुरु" : "Start", ne ? "तलब" : "Salary", ne ? "नियुक्तिपत्र" : "Letter", "SSF", ne ? "३०/६०/९० दिन" : "Day 30/60/90", ne ? "औपचारिक" : "Formal"].map((h) => (
                          <th key={h} className="py-2 pr-4 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule">
                      {r.hires.map((h) => (
                        <tr key={h.id} className="align-top">
                          <td className="py-3 pr-4">
                            <Link href={`/hire/${h.id}`} className="font-medium text-ink hover:underline">{h.worker_name}</Link>
                            <span className="block text-ink-muted">{h.position}</span>
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap">{d(h.start_date)}</td>
                          <td className="py-3 pr-4 whitespace-nowrap">{ne ? "रु" : "Rs"} {localizeDigits(h.salary.toLocaleString("en-IN"), lang)} {PERIOD_LABEL[h.salary_period][lang]}</td>
                          <td className="py-3 pr-4">
                            {h.summary.letter_confirmed_by_worker ? (ne ? "पुष्टि भयो" : "Confirmed") : h.summary.letter_issued ? (ne ? "जारी, पुष्टि बाँकी" : "Issued, unconfirmed") : <span className="text-danger">{ne ? "जारी भएको छैन" : "Not issued"}</span>}
                          </td>
                          <td className="py-3 pr-4">
                            {h.summary.ssf_confirmed_by_worker ? (ne ? "कामदारले पुष्टि गरे" : "Worker confirmed") : h.summary.ssf_reported_by_employer ? (ne ? "तपाईंले भन्नुभयो" : "You reported") : h.summary.ssf_overdue ? <span className="text-danger">{ne ? "म्याद नाघ्यो" : "Overdue"}</span> : `${ne ? "म्याद" : "Due"} ${d(h.summary.ssf_deadline)}`}
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap">{[h.summary.employed_30, h.summary.employed_60, h.summary.employed_90].map((v) => (v === null ? "·" : v ? "✓" : "✗")).join("  ")}</td>
                          <td className="py-3 pr-4">{h.summary.formal ? <Icon name="check-circle" size={18} className="text-moss" label={ne ? "औपचारिक" : "Formal"} /> : "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <p className="mt-8 text-sm text-ink-muted">
              {ne
                ? "यो प्रतिवेदनले SSF अभिलेख र वार्षिक श्रम अडिट (श्रम ऐन, २०७४ दफा १००) को तयारीमा मद्दत गर्छ। यो श्रम अडिट वा कानुनी प्रमाणपत्र होइन। कामदारले तलब र कामबारे दिएका उत्तर गोप्य राखिन्छन् र यहाँ देखाइँदैनन्।"
                : "This report helps you prepare SSF records and your yearly labour audit (Labour Act 2017, section 100). It is not a labour audit or a legal certificate. Workers' answers about pay and how the job is going are kept private and are not shown here."}
            </p>
          </>
        )}
      </main>
    </>
  );
}
