"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "./Icon";
import ReportButton from "./ReportButton";
import { useLang } from "@/lib/useLang";
import { EMPLOYMENT_LABEL, PERIOD_LABEL } from "@/lib/job-format";
import { localizeDigits } from "@/lib/i18n";
import { formatDate } from "@/lib/dates";
import type { EmploymentType, Lang, SalaryPeriod } from "@/lib/types";

type Checkin = {
  id: string;
  day: number;
  due_at: string;
  answered_at: string;
  due: boolean;
  still_employed: number | null;
};
type Data = {
  viewer: "employer" | "worker";
  hire: {
    id: string;
    job_id: string;
    employer_id: string;
    position: string;
    start_date: string;
    salary: number;
    salary_period: SalaryPeriod;
    employment_type: string;
    hours: string;
    probation_months: number;
    duties: string;
    letter_issued_at: string;
    letter_confirmed_at: string;
    ssf_reported_at: string;
    status: "active" | "ended";
    end_reason: string;
  };
  job_title: string;
  location: string;
  business_name: string;
  contact_name: string;
  contact_position: string;
  worker_name: string;
  summary: {
    days_since_start: number;
    letter_confirmed_by_worker: boolean;
    ssf_confirmed_by_worker: boolean;
    ssf_deadline: string;
    ssf_overdue: boolean;
    formal: boolean;
    employed_30: boolean | null;
    employed_60: boolean | null;
    employed_90: boolean | null;
  };
  minimum_wage: number;
  minimum_wage_effective: string;
  demo_tools: boolean;
  checkins: Checkin[];
};

const date = (iso: string, lang: Lang) => formatDate(iso, lang);
const money = (n: number, lang: Lang) => localizeDigits(n.toLocaleString("en-IN"), lang);

export default function HireRecord({ hireId, k }: { hireId: string; k: string }) {
  const [lang] = useLang();
  const ne = lang === "ne";
  const [d, setD] = useState<Data | null>(null);
  const [missing, setMissing] = useState(false);
  const [err, setErr] = useState("");
  const q = k ? `?k=${encodeURIComponent(k)}` : "";

  const load = useCallback(() => {
    fetch(`/api/hires/${hireId}${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setD)
      .catch(() => setMissing(true));
  }, [hireId, q]);
  useEffect(() => load(), [load]);

  const act = async (body: object) => {
    setErr("");
    const r = await fetch(`/api/hires/${hireId}${q}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const out = await r.json();
    if (!r.ok) return setErr(out.error || "Failed");
    setD(out);
  };

  if (missing) return <div className="empty">{ne ? "यो रेकर्ड भेटिएन।" : "This job record could not be found."}</div>;
  if (!d) return <div className="skeleton h-96" />;

  const h = d.hire;
  const isEmployer = d.viewer === "employer";
  const meetsMin = h.salary >= d.minimum_wage;
  const due = d.checkins.find((c) => c.due && !c.answered_at);
  const type = (EMPLOYMENT_LABEL[h.employment_type as EmploymentType] ?? { en: h.employment_type, ne: h.employment_type })[lang];

  const Step = ({ ok, warn, title, children }: { ok: boolean; warn?: boolean; title: string; children: React.ReactNode }) => (
    <li className="flex gap-3 py-4">
      <Icon
        name={ok ? "check-circle" : warn ? "alert" : "clock"}
        size={22}
        className={ok ? "text-moss" : warn ? "text-danger" : "text-ink-muted"}
      />
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-ink">{title}</p>
        <div className="mt-1 text-sm text-ink-light">{children}</div>
      </div>
    </li>
  );

  return (
    <div>
      <header className="print:hidden">
        <p className="eyebrow">{ne ? "कामको रेकर्ड" : "Job record"}</p>
        <h1 className="page-title mt-2">{h.position}</h1>
        <p className="section-sub">
          {d.business_name} · {d.worker_name} · {ne ? "सुरु" : "started"} {date(h.start_date, lang)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={h.status === "active" ? "badge-moss" : "badge-muted"}>
            {h.status === "active" ? (ne ? "काम जारी छ" : "Active") : ne ? "काम सकियो" : "Ended"}
          </span>
          {d.summary.formal && <span className="badge-moss">{ne ? "औपचारिक रोजगारी (कामदारले पुष्टि गरेको)" : "Formal job (worker-confirmed)"}</span>}
        </div>
      </header>

      {err && <div className="alert-error mt-6 print:hidden" role="alert">{err}</div>}

      {/* Check-in due now */}
      {due && h.status === "active" && <CheckinForm day={due.day} isEmployer={isEmployer} lang={lang} onSubmit={(b) => act({ action: "checkin", day: due.day, ...b })} />}

      {/* Formal job checklist */}
      <section className="mt-8 print:hidden" aria-labelledby="checklist">
        <h2 id="checklist" className="section-title">{ne ? "औपचारिक रोजगारी जाँचसूची" : "Formal job checklist"}</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {ne
            ? "यसले SSF अभिलेख र श्रम अडिटको तयारीमा मद्दत गर्छ। यो आफैंमा श्रम अडिट होइन।"
            : "This helps prepare SSF records and the yearly labour audit. It is not a labour audit itself."}
        </p>
        <ol className="mt-3 divide-y divide-rule border-y border-rule">
          <Step ok={Boolean(h.letter_issued_at) && d.summary.letter_confirmed_by_worker} title={ne ? "१. नियुक्तिपत्र" : "1. Appointment letter"}>
            {!h.letter_issued_at
              ? isEmployer
                ? ne ? "तलको मस्यौदा जाँचेर जारी गर्नुहोस्।" : "Check the draft below, then issue it."
                : ne ? "रोजगारदाताले अझै जारी गरेका छैनन्।" : "The employer has not issued it yet."
              : d.summary.letter_confirmed_by_worker
                ? ne ? "जारी भयो र कामदारले प्राप्त गरेको पुष्टि गरे।" : "Issued, and the worker confirmed receiving it."
                : ne ? "जारी भयो; कामदारको पुष्टि बाँकी।" : "Issued; waiting for the worker to confirm."}
            <div className="mt-2 flex flex-wrap gap-2">
              {isEmployer && !h.letter_issued_at && (
                <button type="button" className="btn-primary btn-sm" onClick={() => act({ action: "issue_letter" })}>
                  {ne ? "नियुक्तिपत्र जारी गर्नुहोस्" : "Issue letter"}
                </button>
              )}
              {!isEmployer && h.letter_issued_at && !h.letter_confirmed_at && (
                <button type="button" className="btn-primary btn-sm" onClick={() => act({ action: "confirm_letter" })}>
                  {ne ? "मैले नियुक्तिपत्र पाएँ" : "I received my letter"}
                </button>
              )}
            </div>
          </Step>
          <Step ok={meetsMin} warn={!meetsMin} title={ne ? "२. न्यूनतम पारिश्रमिक" : "2. Minimum wage"}>
            {ne ? `तय भएको: रु ${money(h.salary, lang)} ${PERIOD_LABEL[h.salary_period][lang]}। कानुनी न्यूनतम: रु ${money(d.minimum_wage, lang)} (२०८२ साउन १, अर्थात् १७ जुलाई २०२५ देखि)।` : `Agreed: Rs ${money(h.salary, lang)} ${PERIOD_LABEL[h.salary_period][lang]}. Legal minimum: Rs ${money(d.minimum_wage, lang)} (from ${d.minimum_wage_effective}).`}
          </Step>
          <Step ok={d.summary.ssf_confirmed_by_worker} warn={d.summary.ssf_overdue} title={ne ? "३. सामाजिक सुरक्षा कोष (SSF)" : "3. Social Security Fund (SSF)"}>
            {ne
              ? `नियुक्तिको ३ महिनाभित्र, ${date(d.summary.ssf_deadline, lang)} सम्म दर्ता गर्नुपर्छ। योगदान: कामदार ११%, रोजगारदाता २०%।`
              : `Enrol within 3 months of starting, by ${date(d.summary.ssf_deadline, lang)}. Contributions: 11% worker, 20% employer, on basic salary.`}
            <span className="mt-1 block">
              {ne ? "रोजगारदाता: " : "Employer: "}
              {h.ssf_reported_at ? (ne ? "दर्ता गरेको भनेका छन्" : "says enrolled") : ne ? "अझै भनेका छैनन्" : "not reported yet"}
              {" · "}
              {ne ? "कामदार: " : "Worker: "}
              {d.summary.ssf_confirmed_by_worker ? (ne ? "पुष्टि गरे" : "confirmed") : ne ? "अझै पुष्टि भएको छैन" : "not confirmed yet"}
            </span>
            {isEmployer && (
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-ink">
                <input
                  type="checkbox"
                  checked={Boolean(h.ssf_reported_at)}
                  onChange={(e) => act({ action: "ssf_enrolled", on: e.target.checked })}
                  className="h-5 w-5 accent-[#900000]"
                />
                {ne ? "मैले यो कामदारलाई SSF मा दर्ता गरेँ" : "I have enrolled this worker in the SSF"}
              </label>
            )}
          </Step>
          <Step
            ok={d.summary.employed_90 === true}
            warn={[d.summary.employed_30, d.summary.employed_60, d.summary.employed_90].includes(false)}
            title={ne ? "४. ३०/६०/९० दिनको चेक-इन" : "4. 30/60/90-day check-ins"}
          >
            <ul className="mt-1 grid gap-1 sm:grid-cols-3">
              {d.checkins.map((c) => (
                <li key={c.id} className="flex items-center gap-1.5">
                  <Icon name={c.answered_at ? "check" : c.due ? "alert" : "clock"} size={14} />
                  {ne ? `${localizeDigits(c.day, lang)} दिन` : `Day ${c.day}`}:{" "}
                  {c.answered_at
                    ? c.still_employed
                      ? ne ? "काम जारी" : "still working"
                      : ne ? "काम छाडेको" : "no longer working"
                    : c.due
                      ? ne ? "अहिले बाँकी" : "due now"
                      : date(c.due_at, lang)}
                </li>
              ))}
            </ul>
            {!isEmployer && (
              <span className="mt-2 block text-ink-muted">
                {ne
                  ? "तलब र कामबारे तपाईंका उत्तर रोजगारदातालाई देखाइँदैन।"
                  : "Your answers about pay and how the job is going are not shown to the employer."}
              </span>
            )}
          </Step>
        </ol>
        {d.demo_tools && h.status === "active" && (
          <button type="button" className="btn-ghost btn-sm mt-3 text-ink-muted" onClick={() => act({ action: "demo_advance" })}>
            {ne ? "डेमो: ३० दिन अगाडि सार्नुहोस्" : "Demo only: jump 30 days ahead"}
          </button>
        )}
      </section>

      {/* The letter */}
      <section className="mt-10" aria-labelledby="letter">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <h2 id="letter" className="section-title">{ne ? "नियुक्तिपत्र" : "Appointment letter"}</h2>
          <button type="button" className="btn-secondary btn-sm" onClick={() => window.print()}>
            {ne ? "प्रिन्ट / PDF" : "Print / save PDF"}
          </button>
        </div>
        {!h.letter_issued_at && (
          <p className="alert-note mt-3 print:hidden">{ne ? "मस्यौदा: अझै जारी भएको छैन।" : "Draft: not issued yet."}</p>
        )}
        <article className="mt-4 rounded-lg border border-rule p-6 text-base leading-relaxed sm:p-8 print:border-0 print:p-0">
          <p className="text-right text-sm text-ink-muted">{date(h.letter_issued_at || new Date().toISOString(), lang)}</p>
          <p className="mt-4 font-semibold">{d.business_name}</p>
          <p className="text-sm text-ink-light">{d.location}</p>
          <p className="mt-6">
            {ne ? "प्रिय" : "Dear"} {d.worker_name},
          </p>
          <p className="mt-3">
            {ne
              ? `${d.business_name} ले तपाईंलाई ${h.position} पदमा ${date(h.start_date, lang)} देखि नियुक्त गर्न पाउँदा खुसी छ।`
              : `${d.business_name} is pleased to appoint you as ${h.position}, starting on ${date(h.start_date, lang)}.`}
          </p>
          <dl className="mt-4 divide-y divide-rule border-y border-rule text-sm">
            {[
              [ne ? "पद" : "Position", h.position],
              [ne ? "रोजगारीको प्रकार" : "Employment type", type],
              [ne ? "पारिश्रमिक" : "Remuneration", `${ne ? "रु" : "Rs"} ${money(h.salary, lang)} ${PERIOD_LABEL[h.salary_period][lang]}`],
              [ne ? "कामको समय" : "Working hours", h.hours],
              [ne ? "परीक्षणकाल" : "Probation", h.probation_months ? (ne ? `${localizeDigits(h.probation_months, lang)} महिना` : `${h.probation_months} months`) : ne ? "छैन" : "None"],
              [ne ? "काम र जिम्मेवारी" : "Duties", h.duties],
              [ne ? "सामाजिक सुरक्षा" : "Social security", ne ? "नियुक्तिको ३ महिनाभित्र SSF मा दर्ता गरिनेछ (कामदार ११%, रोजगारदाता २०%)।" : "You will be enrolled in the Social Security Fund within 3 months (11% employee, 20% employer contribution)."],
            ].map(([k2, v]) => (
              <div key={k2} className="grid grid-cols-[9rem_1fr] gap-3 py-2">
                <dt className="text-ink-muted">{k2}</dt>
                <dd className="whitespace-pre-line">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm">
            {ne
              ? "बिदा, सूचना अवधि र अन्य सर्त श्रम ऐन, २०७४ अनुसार हुनेछन्। यो पत्रमा कानुनभन्दा कम सुविधा भएमा कानुन लागू हुन्छ। आवेदक वा कामदारसँग भर्ना शुल्क लिइने छैन।"
              : "Leave, notice and other terms follow the Labour Act 2017. Where this letter offers less than the law, the law applies. No recruitment fee is charged to the worker."}
          </p>
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="border-t border-ink pt-2 text-sm">
                {d.contact_name || "________"}
                {d.contact_position ? `, ${d.contact_position}` : ""}
              </p>
              <p className="text-xs text-ink-muted">
                {ne ? "रोजगारदाताको तर्फबाट" : "For the employer"}
                {h.letter_issued_at ? ` · ${ne ? "मेरिटम्याचमा जारी" : "issued on MeritMatch"} ${date(h.letter_issued_at, lang)}` : ""}
              </p>
            </div>
            <div>
              <p className="border-t border-ink pt-2 text-sm">{d.worker_name}</p>
              <p className="text-xs text-ink-muted">
                {ne ? "कामदार" : "Worker"}
                {h.letter_confirmed_at ? ` · ${ne ? "प्राप्त पुष्टि" : "receipt confirmed"} ${date(h.letter_confirmed_at, lang)}` : ""}
              </p>
            </div>
          </div>
          <p className="mt-6 text-xs text-ink-muted">
            {ne
              ? "मेरिटम्याचले बनाएको मस्यौदा। कानुनी सल्लाह होइन; आवश्यक परे कानुन व्यवसायीसँग जाँच गराउनुहोस्।"
              : "Draft generated by MeritMatch. Not legal advice; have it checked by a lawyer if needed."}
          </p>
        </article>
      </section>

      {!isEmployer && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rule px-4 py-3 print:hidden">
          <p className="text-sm text-ink-light">
            {ne ? "तलब नपाएको, दुर्व्यवहार वा अरू समस्या? गोप्य रूपमा भन्नुहोस्।" : "Unpaid wages, mistreatment or another problem? Tell us privately."}
          </p>
          <ReportButton jobId={h.job_id} employerId={h.employer_id} about={`${h.position} · ${d.business_name}`} lang={lang} variant="button" />
        </div>
      )}
    </div>
  );
}

function CheckinForm({
  day,
  isEmployer,
  lang,
  onSubmit,
}: {
  day: number;
  isEmployer: boolean;
  lang: Lang;
  onSubmit: (b: object) => Promise<void>;
}) {
  const ne = lang === "ne";
  const [a, setA] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const Q = ({ id, label, dontKnow }: { id: string; label: string; dontKnow?: boolean }) => (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-base font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {[
          ["yes", ne ? "हो" : "Yes"],
          ["no", ne ? "होइन" : "No"],
          ...(dontKnow ? [["unknown", ne ? "थाहा छैन" : "Not sure"]] : []),
        ].map(([v, l]) => (
          <button key={v} type="button" aria-pressed={a[id] === v} onClick={() => setA({ ...a, [id]: v })} className={`chip ${a[id] === v ? "chip-on" : ""}`}>
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
  return (
    <section className="mt-8 rounded-lg border-2 border-brand/40 p-5 print:hidden" aria-labelledby="checkin-h">
      <h2 id="checkin-h" className="text-xl font-semibold">
        {ne ? `${localizeDigits(day, lang)} दिनको चेक-इन` : `${day}-day check-in`}
      </h2>
      <p className="mt-1 text-sm text-ink-light">{ne ? "एक मिनेट लाग्छ।" : "It takes a minute."}</p>
      <div className="mt-4 space-y-5">
        <Q id="still_employed" label={isEmployer ? (ne ? "यो व्यक्ति अझै तपाईंसँग काम गर्दै हुनुहुन्छ?" : "Is this person still working with you?") : ne ? "के तपाईं अझै त्यहाँ काम गर्दै हुनुहुन्छ?" : "Are you still working there?"} />
        {!isEmployer && (
          <>
            <Q id="has_letter" label={ne ? "तपाईंले लिखित नियुक्तिपत्र वा सम्झौता पाउनुभयो?" : "Did you get a written appointment letter or contract?"} />
            <Q id="ssf" label={ne ? "तपाईंलाई सामाजिक सुरक्षा कोष (SSF) मा दर्ता गरिएको छ?" : "Have you been enrolled in the Social Security Fund (SSF)?"} dontKnow />
            <Q id="paid_on_time" label={ne ? "तपाईंले समयमै तलब पाउनुभएको छ?" : "Have you been paid on time?"} />
          </>
        )}
        <fieldset className="min-w-0">
          <legend className="mb-2 text-base font-medium text-ink">
            {isEmployer ? (ne ? "काम कस्तो चलिरहेको छ? (ऐच्छिक)" : "How is it going? (optional)") : ne ? "काम कस्तो लागिरहेको छ? (ऐच्छिक)" : "How do you feel about the job? (optional)"}
          </legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-pressed={a.rating === String(n)} onClick={() => setA({ ...a, rating: String(n) })} className={`chip w-11 justify-center ${a.rating === String(n) ? "chip-on" : ""}`}>
                {localizeDigits(n, lang)}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <button
        type="button"
        className="btn-primary mt-5"
        disabled={!a.still_employed || busy}
        onClick={async () => {
          setBusy(true);
          await onSubmit({ ...a, rating: a.rating ? Number(a.rating) : undefined });
          setBusy(false);
        }}
      >
        {ne ? "पठाउनुहोस्" : "Send answers"}
      </button>
    </section>
  );
}
