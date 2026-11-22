"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { LogoMark } from "@/components/Logo";
import { useLang } from "@/lib/useLang";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";
import Icon, { type IconName } from "@/components/Icon";
import ScoringExplainer from "@/components/ScoringExplainer";

const L = (en: string, ne: string): Record<Lang, string> => ({ en, ne });

const COPY = {
  headline: L("Show what you can do. Get hired for it.", "आफूले के गर्न सक्नुहुन्छ देखाउनुहोस्। त्यसैका आधारमा काम पाउनुहोस्।"),
  employerLink: L("Hiring? Post a job", "भर्ना गर्दै हुनुहुन्छ? काम पोस्ट गर्नुहोस्"),
  legendYou: L("You, as your work", "तपाईं, तपाईंको कामको रूपमा"),
  legendJob: L("The job", "काम"),
  legendMatch: L("Where they overlap is the match", "दुवै मिल्ने ठाउँ नै म्याच हो"),
  promisesTitle: L("What we promise", "हाम्रो वाचा"),
  stepsLead: L(
    "Four steps, the same for everyone. Most tasks take about 15 minutes on a phone.",
    "सबैका लागि उही चार चरण। धेरैजसो कार्य फोनमै करिब १५ मिनेटमा सकिन्छ।",
  ),
  seekersEyebrow: L("For people looking for work", "काम खोज्नेहरूका लागि"),
  seekersTitle: L("Your experience counts, even if it was never a job.", "जागिर नभए पनि तपाईंको अनुभवको मूल्य छ।"),
  seekersBody: L(
    "Caring for family, running a shop, farming, sewing, volunteering: the Experience Mapper turns what you did into skills employers look for, then shows jobs that fit.",
    "परिवारको हेरचाह, पसल चलाउनु, खेती, सिलाइ, स्वयंसेवा: एक्सपेरियन्स म्यापरले तपाईंले गरेको कामलाई रोजगारदाताले खोज्ने सीपमा बदल्छ, र मिल्ने काम देखाउँछ।",
  ),
  seekersCta: L("Try the Experience Mapper", "एक्सपेरियन्स म्यापर प्रयोग गर्नुहोस्"),
  exampleLabel: L("Someone wrote", "कसैले लेखे"),
  exampleText: L(
    "“I looked after my grandmother for three years and helped in my uncle's shop on weekends.”",
    "“मैले तीन वर्ष हजुरआमाको हेरचाह गरेँ र शनिबार काकाको पसलमा सघाएँ।”",
  ),
  exampleSkills: L("Skills it found", "भेटिएका सीप"),
  skillA: L("Time management", "समय व्यवस्थापन"),
  skillB: L("Problem solving", "समस्या समाधान"),
  skillC: L("Customer service", "ग्राहक सेवा"),
  skillD: L("Working with numbers", "हिसाबकिताब"),
  exampleNote: L(
    "Described skills help suggest jobs. You prove them by doing a job's task.",
    "भनिएका सीपले काम सुझाउन मद्दत गर्छन्। कामको कार्य गरेर तिनलाई प्रमाणित गर्नुहुन्छ।",
  ),
  employersEyebrow: L("For employers", "रोजगारदाताहरूका लागि"),
  employersTitle: L("Rank people on the work, not the CV.", "CV होइन, कामका आधारमा क्रम मिलाउनुहोस्।"),
  employersCta: L("Post your first job", "पहिलो काम पोस्ट गर्नुहोस्"),
  scoringTitle: L("How scoring works, and where AI is used", "कसरी अंक दिइन्छ र AI कहाँ प्रयोग हुन्छ"),
  scoringLead: L(
    "Every number comes with a reason. Here is what each part is, and who or what produces it.",
    "हरेक अंकको कारण हुन्छ। प्रत्येक भाग के हो, र कसले वा केले दिन्छ, यहाँ छ।",
  ),
};

/** What an employer gets. Each line maps to something the app actually does. */
const EMPLOYER_GAINS: { icon: IconName; title: Record<Lang, string>; body: Record<Lang, string> }[] = [
  {
    icon: "list-check",
    title: L("Compare like with like", "बराबरीको तुलना"),
    body: L(
      "Every applicant does the same short task, so the ranking is about the work.",
      "सबै आवेदकले उही छोटो कार्य गर्छन्, त्यसैले क्रम कामकै आधारमा हुन्छ।",
    ),
  },
  {
    icon: "eye-off",
    title: L("Less bias, by design", "डिजाइनबाटै कम पूर्वाग्रह"),
    body: L(
      "You see a code and a score. Names stay hidden until you shortlist and the person agrees.",
      "तपाईंले कोड र अंक देख्नुहुन्छ। छनौट गरेर व्यक्तिले सहमति नदिएसम्म नाम लुकेको रहन्छ।",
    ),
  },
  {
    icon: "clock",
    title: L("A shortlist in minutes", "मिनेटमै छनौट सूची"),
    body: L(
      "Applicants arrive ranked, with the reason for every mark and their answers to read.",
      "आवेदक क्रमबद्ध भएरै आउँछन्, हरेक अंकको कारण र पढ्न मिल्ने उत्तरसहित।",
    ),
  },
  {
    icon: "camera",
    title: L("Works for trades too", "सीपमूलक कामका लागि पनि"),
    body: L(
      "Ask for photos of finished work, or a short video from shortlisted people, and rate it yourself.",
      "तयार कामको फोटो, वा छनौट भएकासँग छोटो भिडियो माग्नुहोस्, र आफैं अंक दिनुहोस्।",
    ),
  },
  {
    icon: "pin",
    title: L("People who want to be there", "त्यहीँ बस्न चाहनेहरू"),
    body: L(
      "Your job is shown first to people who chose your city.",
      "तपाईंको काम तपाईंकै शहर रोज्नेलाई पहिले देखाइन्छ।",
    ),
  },
  {
    icon: "alert",
    title: L("Honesty notes, not accusations", "आरोप होइन, इमान्दारी सङ्केत"),
    body: L(
      "Pasted text, rushed work and copied answers are flagged for you to ask about. They never change the score.",
      "टाँसिएको पाठ, हतारको काम र नक्कल गरिएका उत्तर सोध्नका लागि जनाइन्छ। यिनले अंक बदल्दैनन्।",
    ),
  },
];

const PROMISES = ["fairHiring", "skillFirst", "accessibility"] as const;
const STEPS = ["step1", "step2", "step3", "step4"] as const;

export default function Home() {
  const [lang, setLang] = useLang();

  return (
    <>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="border-b border-rule">
          <div className="container-main grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.25fr_1fr] lg:py-24">
            <div>
              <h1 className="font-display text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                {COPY.headline[lang]}
              </h1>
              <p className="mt-6 max-w-xl text-lg text-ink-light sm:text-xl sm:leading-relaxed">{t("heroSub", lang)}</p>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link href="/signup" className="btn-primary btn-lg">
                  {t("getStarted", lang)}
                </Link>
                <Link href="/jobs" className="link inline-flex items-center gap-1.5 text-base">
                  {t("browseAll", lang)}
                  <Icon name="arrow-right" size={18} />
                </Link>
              </div>
              <p className="mt-8 text-sm text-ink-muted">
                <Link href="/signup" className="font-medium text-ink underline-offset-4 hover:underline">
                  {COPY.employerLink[lang]}
                </Link>
              </p>
            </div>

            {/* The mark, explained: it is the product idea, not decoration */}
            <figure className="mx-auto w-full max-w-[320px]">
              <LogoMark size={220} className="mx-auto h-auto w-full max-w-[300px] text-ink" />
              <figcaption className="mt-8 grid gap-2.5 border-t border-rule pt-5 text-sm text-ink-light">
                <span className="flex items-center gap-3">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-ink" aria-hidden />
                  {COPY.legendYou[lang]}
                </span>
                <span className="flex items-center gap-3">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {COPY.legendJob[lang]}
                </span>
                <span className="flex items-center gap-3">
                  <span className="relative h-3.5 w-3.5 shrink-0" aria-hidden>
                    <span className="absolute inset-0 rounded-full border-2 border-ink" />
                    <span className="absolute inset-0 translate-x-1 rounded-full bg-brand/70" />
                  </span>
                  {COPY.legendMatch[lang]}
                </span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Promises: a plain row of statements, no cards */}
        <section className="container-main py-14">
          <h2 className="sr-only">{COPY.promisesTitle[lang]}</h2>
          <dl className="grid gap-8 sm:grid-cols-3 sm:gap-10">
            {PROMISES.map((k) => (
              <div key={k} className="border-l-2 border-brand pl-5">
                <dt className="text-xl font-semibold text-ink">{t(k, lang)}</dt>
                <dd className="mt-2 text-base text-ink-light">{t(`${k}Desc`, lang)}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* How it works: heading left, numbered steps right */}
        <section className="border-y border-rule bg-paper-dark">
          <div className="container-main grid gap-10 py-16 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
            <div>
              <h2 className="section-title">{t("howItWorks", lang)}</h2>
              <p className="section-sub max-w-sm">{COPY.stepsLead[lang]}</p>
            </div>
            <ol className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-4">
                  <span className="font-display text-4xl font-semibold leading-none text-brand" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{t(`${s}Title`, lang)}</h3>
                    <p className="mt-1 text-base text-ink-light">{t(`${s}Desc`, lang)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* For job seekers: the Experience Mapper, shown with a real example */}
        <section className="container-main grid items-start gap-12 py-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">{COPY.seekersEyebrow[lang]}</p>
            <h2 className="section-title mt-3 max-w-md">{COPY.seekersTitle[lang]}</h2>
            <p className="mt-4 max-w-lg text-base text-ink-light">{COPY.seekersBody[lang]}</p>
            <Link href="/experience-mapper" className="btn-secondary mt-8">
              {COPY.seekersCta[lang]}
              <Icon name="arrow-right" size={18} />
            </Link>
          </div>

          <div className="rounded-lg border border-rule">
            <div className="p-6">
              <p className="eyebrow">{COPY.exampleLabel[lang]}</p>
              <p className="mt-2 font-display text-xl leading-snug text-ink">{COPY.exampleText[lang]}</p>
            </div>
            <div className="border-t border-rule bg-paper-dark p-6">
              <p className="eyebrow">{COPY.exampleSkills[lang]}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {[COPY.skillA, COPY.skillB, COPY.skillC, COPY.skillD].map((s) => (
                  <li key={s.en} className="rounded-md border border-rule bg-white px-3 py-1.5 text-sm text-ink">
                    {s[lang]}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-ink-muted">{COPY.exampleNote[lang]}</p>
            </div>
          </div>
        </section>

        {/* For employers: distinct treatment, a two-column list instead of cards */}
        <section className="border-y border-rule bg-paper-dark">
          <div className="container-main py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">{COPY.employersEyebrow[lang]}</p>
                <h2 className="section-title mt-3 max-w-xl">{COPY.employersTitle[lang]}</h2>
              </div>
              <Link href="/signup" className="btn-primary">
                {COPY.employersCta[lang]}
              </Link>
            </div>
            <ul className="mt-12 grid gap-x-12 gap-y-8 md:grid-cols-2">
              {EMPLOYER_GAINS.map((g) => (
                <li key={g.icon} className="flex gap-4 border-t border-rule pt-6">
                  <Icon name={g.icon} size={22} className="mt-0.5 text-brand-ink" />
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{g.title[lang]}</h3>
                    <p className="mt-1 text-base text-ink-light">{g.body[lang]}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Scoring transparency */}
        <section className="container-main grid gap-10 py-20 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <h2 className="section-title">{COPY.scoringTitle[lang]}</h2>
            <p className="section-sub">{COPY.scoringLead[lang]}</p>
          </div>
          <ScoringExplainer lang={lang} audience="public" aiScoring evidence="all" bare />
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="container-main flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-ink-muted">
          <span className="flex items-center gap-2.5">
            <LogoMark size={18} className="text-ink" />© {new Date().getFullYear()} MeritMatch
          </span>
          <button type="button" onClick={() => setLang(lang === "en" ? "ne" : "en")} className="link inline-flex items-center gap-1.5">
            <Icon name="globe" size={16} />
            {t("langToggle", lang)}
          </button>
        </div>
      </footer>
    </>
  );
}
