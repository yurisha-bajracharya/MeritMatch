"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { LogoMark } from "@/components/Logo";
import { useState } from "react";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";

const FEATURES = [
  { key: "fairHiring", icon: "⚖️" },
  { key: "skillFirst", icon: "💪" },
  { key: "accessibility", icon: "📱" },
] as const;

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
              <LogoMark size={260} className="text-ink opacity-95" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-main py-16">
        <div className="grid sm:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.key} className="card-hover text-center">
              <div className="text-3xl mb-3">{f.icon}</div>
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
            <LogoMark size={16} className="text-ink opacity-70" />
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
