"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Icon from "@/components/Icon";
import Segmented from "@/components/Segmented";
import EvidenceUploader from "@/components/EvidenceUploader";
import ScoringExplainer from "@/components/ScoringExplainer";
import { x } from "@/lib/i18n-extra";
import { useLang } from "@/lib/useLang";
import type { Lang } from "@/lib/types";
import { t, localizeDigits } from "@/lib/i18n";

type Outcome = {
  job: { id: string; title: string; employer_name: string; location: string; evidence: "none" | "photos" | "video"; ai_scoring: boolean };
  total: number;
  writtenScore: number | null;
  mcqScore: number | null;
  mcqCorrect: number | null;
  mcqTotal: number | null;
  reason: string;
  criteriaLabels?: Record<string, { en: string; ne: string }>;
  criteria: { id: string; score: number; max: number; reason: string }[];
  scoredBy: string;
  consent: boolean;
  rank: number | null;
  applicants: number | null;
  shortlisted: boolean;
  media: { id: string; kind: "photo" | "video"; caption?: string }[];
};

export default function OutcomePage() {
  const params = useParams();
  const submissionId = params.id as string;
  const [lang, setLang] = useLang();
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<Outcome | null>(null);
  const [missing, setMissing] = useState(false);
  const [toggling, setToggling] = useState(false);

  // The secret lives in the link (?k=...). Fall back to the copy saved on
  // this device when the candidate submitted from it.
  useEffect(() => {
    let k = new URLSearchParams(window.location.search).get("k");
    if (!k) {
      try {
        k = localStorage.getItem(`mm_outcome_${submissionId}`);
      } catch {}
    }
    if (k) setToken(k);
    else setMissing(true);
  }, [submissionId]);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`/api/submissions/${submissionId}?k=${encodeURIComponent(token)}`);
    if (!res.ok) {
      setMissing(true);
      return;
    }
    setData(await res.json());
  }, [submissionId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleConsent = async () => {
    if (!data || !token) return;
    const next = !data.consent;
    // Flip straight away so it feels instant; undo if the server says no.
    setData({ ...data, consent: next });
    setToggling(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: next, k: token }),
      });
      if (!res.ok) throw new Error("consent");
    } catch {
      setData((d) => (d ? { ...d, consent: !next } : d));
    } finally {
      setToggling(false);
    }
  };

  if (missing) {
    return (
      <>
        <Navbar />
        <div className="container-main mx-auto max-w-lg py-12">
          <div className="card text-center">
            <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ochre-light text-ochre">
              <Icon name="lock" size={22} />
            </span>
            <h1 className="section-title">
              {lang === "ne" ? "यो लिंक खोल्न सकिएन" : "This link can't be opened"}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {lang === "ne"
                ? "नतिजा हेर्न तपाईंले काम पेश गरेपछि पाएको पूरा लिंक चाहिन्छ। सुरक्षाका लागि अरू कसैले हेर्न सक्दैन।"
                : "Your result needs the full link you got when you submitted. For your privacy nobody else can open it."}
            </p>
            <Link href="/jobs" className="btn-primary mt-5 inline-flex">
              {lang === "ne" ? "कामहरू हेर्नुहोस्" : "Browse jobs"}
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <div className="container-main mx-auto max-w-lg py-12">
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </>
    );
  }

  const n = (v: number | null | undefined) => (v === null || v === undefined ? "" : localizeDigits(v, lang));

  return (
    <>
      <Navbar />
      <div className="container-main mx-auto max-w-lg space-y-4 py-8">
        <div className="flex justify-end">
          <Segmented
            name="outcome-lang"
            value={lang}
            onChange={setLang}
            options={[
              { value: "en", label: "English" },
              { value: "ne", label: "नेपाली" },
            ]}
          />
        </div>

        <div className="card animate-fade-in text-center">
          <h1 className="section-title">{t("outcomeTitle", lang)}</h1>
          <p className="mt-1 text-sm text-ink-light">
            {data.job.title} · {data.job.employer_name}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">#{submissionId.slice(0, 4).toUpperCase()}</p>

          <p className="mt-5 text-4xl font-bold text-brand">{n(data.total)}%</p>
          <p className="text-xs text-ink-muted">{t("totalScore", lang)}</p>

          {data.mcqTotal ? (
            <div className="mt-4 grid grid-cols-2 gap-2 text-left">
              <div className="rounded-lg bg-paper-dark p-3">
                <p className="text-[11px] text-ink-muted">{lang === "ne" ? "छनोट प्रश्न" : "Choice questions"}</p>
                <p className="text-sm font-semibold">
                  {n(data.mcqCorrect)}/{n(data.mcqTotal)}
                </p>
              </div>
              <div className="rounded-lg bg-paper-dark p-3">
                <p className="text-[11px] text-ink-muted">{lang === "ne" ? "लिखित उत्तर" : "Written answers"}</p>
                <p className="text-sm font-semibold">{n(data.writtenScore)}%</p>
              </div>
            </div>
          ) : null}

          {data.rank && data.applicants ? (
            <p className="mt-4 text-sm text-ink-light">
              {t("rank", lang)} {n(data.rank)} {t("outOf", lang)} {n(data.applicants)}
            </p>
          ) : null}

          <p
            className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium ${
              data.shortlisted ? "text-moss" : "text-ink-muted"
            }`}
          >
            {data.shortlisted && <Icon name="check-circle" size={16} />}
            {data.shortlisted ? t("shortlisted", lang) : x("stillReview", lang)}
          </p>
          {!data.shortlisted && (
            <p className="mt-1 text-xs text-ink-muted">
              {x("stillReviewHint", lang)}
            </p>
          )}
        </div>

        {data.criteria.length > 0 && (
          <div className="card">
            <h2 className="text-base font-semibold">{lang === "ne" ? "लिखित उत्तरको विवरण" : "Your written answers, in detail"}</h2>
            <ul className="mt-3 space-y-3">
              {data.criteria.map((c) => (
                <li key={c.id}>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-light">{data.criteriaLabels?.[c.id]?.[lang] ?? c.id.replace(/_/g, " ")}</span>
                    <span className="font-semibold">
                      {n(c.score)}/{n(c.max)}
                    </span>
                  </div>
                  <div className="progress-bar mt-1">
                    <div className="progress-bar-fill" style={{ width: `${(c.score / c.max) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{c.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.job.evidence === "photos" && (
          <EvidenceUploader
            kind="photos"
            submissionId={submissionId}
            token={token!}
            items={data.media}
            lang={lang}
            onChange={load}
          />
        )}
        {data.job.evidence === "video" &&
          (data.shortlisted ? (
            <EvidenceUploader
              kind="video"
              submissionId={submissionId}
              token={token!}
              items={data.media}
              lang={lang}
              onChange={load}
            />
          ) : (
            <div className="card flex gap-3 text-sm text-ink-light">
              <Icon name="video" size={18} className="mt-0.5 text-brand" />
              <p>
                {lang === "ne"
                  ? "यो काममा छनौट भएका उम्मेदवारसँग एउटा छोटो भिडियो माग्न सकिन्छ। छनौट भएमा यही पेजमा थप्ने ठाउँ देखिन्छ।"
                  : "This job may ask shortlisted candidates for one short video. If you are shortlisted, the upload box appears on this page."}
              </p>
            </div>
          ))}

        <div className="card">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={data.consent}
              onChange={toggleConsent}
              disabled={toggling}
              className="mt-1 h-4 w-4 rounded border-rule text-brand focus:ring-brand"
            />
            <div>
              <span className="text-sm font-medium">{t("consentLabel", lang)}</span>
              <p className="mt-0.5 text-xs text-ink-muted">
                {data.consent ? t("consentGranted", lang) : t("consentHint", lang)}
              </p>
            </div>
          </label>
        </div>

        <ScoringExplainer
          lang={lang}
          audience="candidate"
          aiScoring={data.job.ai_scoring}
          aiUnavailable={data.job.ai_scoring && data.scoredBy === "fallback"}
          evidence={data.job.evidence}
          title={lang === "ne" ? "तपाईंको अंक कसरी निकालियो" : "How your score was worked out"}
        />
      </div>
    </>
  );
}
