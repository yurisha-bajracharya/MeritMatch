"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { LogoMark } from "@/components/Logo";
import { useState } from "react";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";
import { IconTile, type IconName } from "@/components/Icon";
import ScoringExplainer from "@/components/ScoringExplainer";

const FEATURES: { key: "fairHiring" | "skillFirst" | "accessibility"; icon: IconName }[] = [
  { key: "fairHiring", icon: "scale" },
  { key: "skillFirst", icon: "target" },
  { key: "accessibility", icon: "phone" },
];

/** What an employer actually gets. Each line maps to something the app does. */
const EMPLOYER_GAINS: { icon: IconName; title: Record<Lang, string>; body: Record<Lang, string> }[] = [
  {
    icon: "list-check",
    title: { en: "Compare like with like", ne: "बराबरीको तुलना" },
    body: {
      en: "Every applicant does the same short task, so you rank people on the work, not on whose CV is longest.",
      ne: "सबै आवेदकले उही छोटो कार्य गर्छन्, त्यसैले लामो CV होइन, कामकै आधारमा क्रम मिल्छ।",
    },
  },
  {
    icon: "clock",
    title: { en: "A shortlist in minutes", ne: "मिनेटमै छनौट सूची" },
    body: {
      en: "Applicants arrive already ranked, with the top quarter marked shortlisted and the reason for each score.",
      ne: "आवेदकहरू क्रमबद्ध भएरै आउँछन्, माथिल्लो चौथाइ छनौटमा चिन्ह लगाइएको र प्रत्येक अंकको कारणसहित।",
    },
  },
  {
    icon: "eye-off",
    title: { en: "Less bias, by design", ne: "डिजाइनबाटै कम पूर्वाग्रह" },
    body: {
      en: "You see a code and a score. Name, gender and region stay hidden until the candidate chooses to share them.",
      ne: "तपाईंले कोड र अंक मात्र देख्नुहुन्छ। उम्मेदवारले साझा गर्न रोजेपछि मात्र नाम, लिङ्ग र क्षेत्र देखिन्छ।",
    },
  },
  {
    icon: "camera",
    title: { en: "Works for trades too", ne: "सीपमूलक कामका लागि पनि" },
    body: {
      en: "Ask for photos of finished sewing or cooking, or a short teaching video from shortlisted people only. You rate them yourself.",
      ne: "सिलाइ वा खाना पकाएको फोटो, वा छनौट भएकासँग मात्र छोटो शिक्षण भिडियो माग्न सकिन्छ। अंक तपाईं आफैं दिनुहुन्छ।",
    },
  },
  {
    icon: "pin",
    title: { en: "People who want to be there", ne: "त्यहीँ बस्न चाहनेहरू" },
    body: {
      en: "Your job is shown first to people who chose your city, so fewer applicants drop out over location.",
      ne: "तपाईंको काम तपाईंकै शहर रोज्ने मानिसलाई पहिले देखाइन्छ, त्यसैले स्थानका कारण पछि हट्ने कम हुन्छन्।",
    },
  },
  {
    icon: "alert",
    title: { en: "Honest about cheating", ne: "नक्कलबारे इमान्दार" },
    body: {
      en: "Pasted text, rushed work and copied answers are flagged for you to check. We don't pretend to detect AI writing.",
      ne: "टाँसिएको पाठ, हतारमा गरिएको काम र नक्कल गरिएका उत्तर तपाईंले जाँच्न चिन्ह लगाइन्छ। हामी AI ले लेखेको पत्ता लगाउँछौं भनेर बहाना गर्दैनौं।",
    },
  },
];

const GAINS_TITLE: Record<Lang, string> = {
  en: "What employers get",
  ne: "रोजगारदाताले के पाउँछन्",
};

const STEPS = [
  { key: "step1", icon: "1" },
  { key: "step2", icon: "2" },
  { key: "step3", icon: "3" },
  { key: "step4", icon: "4" },
] as const;

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden glow grid-field">
        <div className="container-main relative py-20 sm:py-28">
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
            <div className="max-w-2xl">
              <span className="badge-brand mb-5">
                {t("tagline", lang)}
              </span>
              <h1 className="text-4xl sm:text-6xl font-display font-bold leading-[1.05] tracking-tight">
                <span className="text-ink">{t("appName", lang)}</span>
              </h1>
              <p className="text-ink-light mt-5 max-w-lg leading-relaxed text-lg">
                {t("heroSub", lang)}
              </p>
              <div className="flex flex-wrap gap-3 mt-9">
                <Link href="/signup" className="btn-primary text-base px-8 py-3">
                  {t("getStarted", lang)}
                </Link>
                <Link href="/jobs" className="btn-secondary text-base px-8 py-3">
                  {t("browseAll", lang)}
                </Link>
              </div>
            </div>

            {/* The mark, at display size */}
            <div className="hidden lg:flex justify-center">
              <LogoMark size={260} className="text-white opacity-95" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-main py-16">
        <div className="grid sm:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.key} className="card-hover text-center">
              <div className="mb-3 flex justify-center">
                <IconTile name={f.icon} size={22} />
              </div>
              <h3 className="font-semibold text-ink">
                {t(f.key, lang)}
              </h3>
              <p className="text-sm text-ink-light mt-2">
                {t(`${f.key}Desc`, lang)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface border-y border-rule">
        <div className="container-main py-16">
          <h2 className="section-title text-center mb-10">
            {t("howItWorks", lang)}
          </h2>

          <div className="grid sm:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.key} className="text-center">
                <div className="w-10 h-10 rounded-full bg-brand-gradient text-paper flex items-center justify-center font-bold text-lg mx-auto">
                  {s.icon}
                </div>
                {i < 3 && (
                  <div className="hidden sm:block w-full h-px bg-rule mt-5 mb-4" />
                )}
                <h4 className="font-semibold text-sm mt-4">
                  {t(`${s.key}Title`, lang)}
                </h4>
                <p className="text-xs text-ink-light mt-1.5">
                  {t(`${s.key}Desc`, lang)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What employers get */}
      <section className="container-main py-16">
        <h2 className="section-title text-center mb-8">{GAINS_TITLE[lang]}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EMPLOYER_GAINS.map((g) => (
            <div key={g.icon} className="card-hover">
              <IconTile name={g.icon} size={20} />
              <h3 className="font-semibold text-ink mt-3">{g.title[lang]}</h3>
              <p className="text-sm text-ink-light mt-1.5">{g.body[lang]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How scoring works, and where AI is used */}
      <section className="bg-surface border-y border-rule">
        <div className="container-main py-16 max-w-3xl">
          <ScoringExplainer
            lang={lang}
            audience="public"
            aiScoring
            evidence="all"
            title={lang === "ne" ? "कसरी अंक दिइन्छ र AI कहाँ प्रयोग हुन्छ" : "How we score, and where AI is used"}
          />
        </div>
      </section>

      {/* For employers CTA */}
      <section className="container-main py-16">
        <div className="card relative overflow-hidden glow border-brand/20 text-center">
          <h2 className="section-title">{t("forEmployers", lang)}</h2>
          <p className="text-ink-light mt-2 max-w-lg mx-auto">
            {t("forEmployersDesc", lang)}
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Link href="/signup" className="btn-primary">
              {t("getStarted", lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-rule bg-surface">
        <div className="container-main py-8 flex items-center justify-between text-xs text-ink-muted">
          <span className="flex items-center gap-2">
            <LogoMark size={16} className="text-white opacity-70" />
            © {new Date().getFullYear()} MeritMatch · Nepal
          </span>
          <button
            onClick={() => setLang(lang === "en" ? "ne" : "en")}
            className="hover:text-ink"
          >
            {t("langToggle", lang)}
          </button>
        </div>
      </footer>
    </>
  );
}
