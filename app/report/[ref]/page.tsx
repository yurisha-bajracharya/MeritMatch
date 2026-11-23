"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useLang } from "@/lib/useLang";
import { CATEGORY_LABEL, STATUS_LABEL, type ReportCategory, type ReportStatus } from "@/lib/reports";

type Data = {
  ref: string;
  category: ReportCategory;
  status: ReportStatus;
  message: string;
  job_title: string;
  business_name: string;
  created_at: string;
  updated_at: string;
};

function Inner() {
  const { ref } = useParams() as { ref: string };
  const k = useSearchParams().get("k") ?? "";
  const [lang] = useLang();
  const [data, setData] = useState<Data | null>(null);
  const [missing, setMissing] = useState(false);
  const ne = lang === "ne";

  useEffect(() => {
    fetch(`/api/reports/${encodeURIComponent(ref)}?k=${encodeURIComponent(k)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setMissing(true));
  }, [ref, k]);

  const date = (s: string) => new Date(s).toLocaleDateString(ne ? "ne-NP" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  const stepIndex = data ? (["resolved", "dismissed"].includes(data.status) ? 2 : data.status === "new" ? 0 : 1) : 0;

  return (
    <main className="container-main max-w-2xl py-10">
      <p className="eyebrow">{ne ? "रिपोर्टको स्थिति" : "Report status"}</p>
      {missing ? (
        <div className="empty mt-4">{ne ? "यो रिपोर्ट भेटिएन। पूरा लिंक प्रयोग गर्नुहोस्।" : "We could not find this report. Use the full link you were given."}</div>
      ) : !data ? (
        <div className="skeleton mt-4 h-48" />
      ) : (
        <>
          <h1 className="page-title mt-2 font-mono">{data.ref}</h1>
          <p className="section-sub">
            {CATEGORY_LABEL[data.category][lang]}
            {data.job_title || data.business_name ? ` · ${data.job_title || data.business_name}` : ""}
          </p>

          <ol className="mt-8 grid grid-cols-3 gap-2 text-sm">
            {[ne ? "प्राप्त" : "Received", ne ? "समीक्षा" : "In review", ne ? "बन्द" : "Closed"].map((s, i) => (
              <li key={s} className={`border-t-[3px] pt-2 ${i <= stepIndex ? "border-brand text-ink" : "border-rule text-ink-muted"}`}>
                {s}
              </li>
            ))}
          </ol>

          <dl className="mt-8 divide-y divide-rule border-y border-rule">
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-ink-light">{ne ? "अहिलेको स्थिति" : "Current status"}</dt>
              <dd className="font-semibold">{STATUS_LABEL[data.status][lang]}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-ink-light">{ne ? "पठाइएको" : "Sent"}</dt>
              <dd>{date(data.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-ink-light">{ne ? "पछिल्लो अद्यावधिक" : "Last update"}</dt>
              <dd>{date(data.updated_at)}</dd>
            </div>
          </dl>

          {data.status === "awaiting_info" && data.message && (
            <div className="alert-note mt-6">
              <p className="font-semibold">{ne ? "हामीलाई थप जानकारी चाहिन्छ" : "We need more information"}</p>
              <p className="mt-1">{data.message}</p>
              <p className="mt-2 text-sm text-ink-light">
                {ne ? "कृपया थप विवरणसहित नयाँ रिपोर्ट पठाउनुहोस् र यो नम्बर उल्लेख गर्नुहोस्।" : "Please send a new report with the details and mention this reference."}
              </p>
            </div>
          )}

          <p className="mt-8 text-sm text-ink-muted">
            {ne
              ? "तपाईंको रिपोर्ट सार्वजनिक रूपमा देखाइँदैन र रोजगारदातालाई तपाईंको नाम भनिँदैन। हामी निश्चित समयसीमा वा नतिजाको वाचा गर्न सक्दैनौं, तर हरेक रिपोर्ट मानिसले हेर्छ।"
              : "Your report is not shown publicly and the employer is not told who you are. We cannot promise a set time or outcome, but a person reviews every report."}
          </p>
        </>
      )}
    </main>
  );
}

export default function ReportStatusPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={null}>
        <Inner />
      </Suspense>
    </>
  );
}
