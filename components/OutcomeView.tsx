"use client";

import Link from "next/link";
import { useState } from "react";
import PhoneMock from "@/components/PhoneMock";
import Segmented from "@/components/Segmented";
import Stamp from "@/components/Stamp";
import { t } from "@/lib/i18n";
import { TAG_LABELS } from "@/lib/tags";
import type { Lang } from "@/lib/types";

type Props = {
  submissionId: string;
  initialLang: Lang;
  name: string;
  title: string;
  employer: string;
  shortlisted: boolean;
  initialConsent: boolean;
  tags: string[];
};

export default function OutcomeView({
  submissionId,
  initialLang,
  name,
  title,
  employer,
  shortlisted,
  initialConsent,
  tags,
}: Props) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [consent, setConsent] = useState(initialConsent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const vars = { name: name.split(" ")[0], title, employer };

  async function toggleConsent() {
    const next = !consent;
    setSaving(true);
    setError(false);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: next }),
      });
      if (!res.ok) throw new Error();
      setConsent(next);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main lang={lang}>
      <header className="py-5 flex items-center justify-between">
        <span className="font-semibold text-brand">MeritMatch</span>
        {shortlisted && (
          <Stamp
            size={64}
            center={t(lang, "shortStamp")}
            label="SHORTLISTED"
            tone="moss"
            tilt={6}
          />
        )}
      </header>

      <section className="border-t border-rule pt-8">
        <h1 className="font-display text-3xl text-brand">
          {t(lang, shortlisted ? "outcomeYes" : "outcomeNo")}
        </h1>
        <p className="mt-2 text-sm text-ink/75">
          {title}, {employer}
        </p>
      </section>

      <section className="mt-6">
        <PhoneMock time={lang === "ne" ? "अहिले" : "now"}>
          {t(lang, shortlisted ? "smsYes" : "smsNo", vars)}
        </PhoneMock>
      </section>

      {shortlisted && (
        <section className="border-t border-rule mt-8 pt-6">
          <h2 className="font-semibold">{t(lang, "consentHeading")}</h2>
          <button
            type="button"
            role="switch"
            aria-checked={consent}
            disabled={saving}
            onClick={toggleConsent}
            className="mt-2 flex w-full items-center justify-between gap-4 min-h-12 text-left cursor-pointer disabled:opacity-60"
          >
            <span>{t(lang, "consentLabel", { employer })}</span>
            <span
              className={`relative h-8 w-14 shrink-0 rounded-full border-2 border-brand ${consent ? "bg-brand" : "bg-transparent"}`}
              aria-hidden
            >
              <span
                className={`absolute top-0.5 size-6 rounded-full ${consent ? "left-[26px] bg-ochre" : "left-0.5 bg-brand"}`}
              />
            </span>
          </button>
          <p className="mt-2 text-sm" aria-live="polite">
            {error
              ? t(lang, "consentError")
              : t(lang, consent ? "consentOn" : "consentOff", { employer })}
          </p>
        </section>
      )}

      <section className="border-t border-rule mt-8 pt-6">
        <h2 className="font-semibold">{t(lang, "skillsShown")}</h2>
        {tags.length === 0 ? (
          <p className="mt-2 text-sm">{t(lang, "noSkillsYet")}</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="border border-brand text-brand rounded-[3px] px-2 py-1 text-sm"
              >
                {TAG_LABELS[tag]?.[lang] ?? tag}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="border-t border-rule mt-8 pt-6 space-y-6">
        <Link
          href={`/jobs?s=${submissionId}&lang=${lang}`}
          className="btn btn-primary w-full"
        >
          {t(lang, "similarCta")}
        </Link>
        <Segmented
          legend={t(lang, "language")}
          value={lang}
          onChange={setLang}
          options={[
            { value: "ne", label: "नेपाली" },
            { value: "en", label: "English" },
          ]}
        />
      </div>
    </main>
  );
}
