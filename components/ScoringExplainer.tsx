import Icon, { type IconName } from "./Icon";
import { MCQ_WEIGHT } from "@/lib/mcq";
import type { Evidence, Lang } from "@/lib/types";

/**
 * Plain-language answer to "how is this scored, and where is AI used?".
 * Shown to candidates before they start, to employers on the ranking page and
 * when posting, and on the landing page. It describes what the code really
 * does, so keep it in step with lib/scoring.ts, lib/mcq.ts and lib/media.ts.
 */

type Audience = "candidate" | "employer" | "public";
type Row = {
  icon: IconName;
  title: Record<Lang, string>;
  body: Record<Lang, string>;
  /** "No AI" / "AI" / "Human" tag so the answer to "where is AI used" is visible at a glance. */
  by: "none" | "ai" | "human" | "rules";
};

const pct = Math.round(MCQ_WEIGHT * 100);

function rows(
  who: Audience,
  aiScoring: boolean,
  evidence: Evidence | "all",
  aiUnavailable = false,
): Row[] {
  const you = who === "candidate";
  const list: Row[] = [
    {
      icon: "list-check",
      by: "none",
      title: {
        en: `Choice questions (${pct}%)`,
        ne: `छनोट प्रश्न (${pct}%)`,
      },
      body: {
        en: "Real workplace situations with one best answer. Marked against a fixed answer key. No AI is involved, so the same answers always give the same mark.",
        ne: "कामको वास्तविक अवस्था र एउटा सबैभन्दा राम्रो उत्तर। निश्चित उत्तरपुस्तिकासँग जाँचिन्छ। AI प्रयोग हुँदैन, त्यसैले एउटै उत्तरले सधैं उही अंक पाउँछ।",
      },
    },
    aiScoring && aiUnavailable
      ? {
          icon: "pen",
          by: "rules",
          title: {
            en: `Written answers (${100 - pct}%)`,
            ne: `लिखित उत्तर (${100 - pct}%)`,
          },
          body: {
            en: "This job uses AI marking, but the AI service was not available for this submission, so simple keyword rules on our own server were used instead. Nothing was sent to any AI service. Keyword rules are less nuanced than AI marking.",
            ne: "यो कामले AI जाँच प्रयोग गर्छ, तर यो पेशका लागि AI सेवा उपलब्ध थिएन, त्यसैले हाम्रै सर्भरको साधारण शब्द-नियम प्रयोग गरियो। कुनै AI सेवामा केही पठाइएन। शब्द-नियम AI जाँचभन्दा कम सूक्ष्म हुन्छ।",
          },
        }
      : aiScoring
      ? {
          icon: "sparkles",
          by: "ai",
          title: {
            en: `Written answers (${100 - pct}%)`,
            ne: `लिखित उत्तर (${100 - pct}%)`,
          },
          body: {
            en: you
              ? "An AI model reads your answers against the job's scoring guide. Only your answer text is sent. Your name, phone, gender and region are never sent, and phone numbers or emails you type are removed first. Spelling and grammar are not judged, except under clear communication."
              : "An AI model reads each answer against the scoring guide. Only the answer text is sent. Name, phone, gender and region are never sent, and any contact details typed into an answer are removed first. Spelling and grammar are not judged, except under clear communication.",
            ne: you
              ? "AI मोडेलले तपाईंका उत्तरहरू जागिरको अंक-मार्गदर्शनसँग पढ्छ। उत्तरको पाठ मात्र पठाइन्छ। तपाईंको नाम, फोन, लिङ्ग र क्षेत्र कहिल्यै पठाइँदैन, र उत्तरमा लेखेको फोन नम्बर वा इमेल पहिले नै हटाइन्छ। स्पष्ट सञ्चारबाहेक हिज्जे र व्याकरण जाँचिँदैन।"
              : "AI मोडेलले प्रत्येक उत्तर अंक-मार्गदर्शनसँग पढ्छ। उत्तरको पाठ मात्र पठाइन्छ। नाम, फोन, लिङ्ग र क्षेत्र कहिल्यै पठाइँदैन, र उत्तरमा लेखिएका सम्पर्क विवरण पहिले नै हटाइन्छ। स्पष्ट सञ्चारबाहेक हिज्जे र व्याकरण जाँचिँदैन।",
          },
        }
      : {
          icon: "pen",
          by: "rules",
          title: {
            en: `Written answers (${100 - pct}%)`,
            ne: `लिखित उत्तर (${100 - pct}%)`,
          },
          body: {
            en: "This employer turned AI off. Written answers are scored by simple keyword rules on our own server and nothing is sent to any AI service. This is less nuanced than AI marking.",
            ne: "यो रोजगारदाताले AI बन्द गर्नुभएको छ। लिखित उत्तर हाम्रै सर्भरमा साधारण शब्द-नियमले जाँचिन्छ र कुनै AI सेवामा केही पठाइँदैन। यो AI जाँचभन्दा कम सूक्ष्म हुन्छ।",
          },
        },
    {
      icon: "alert",
      by: "none",
      title: {
        en: "Honesty notes",
        ne: "इमान्दारी सङ्केत",
      },
      body: {
        en: "We note if a lot of text was pasted, if the work was finished unusually fast, or if two answers are nearly identical. These are hints for a person to look at, never an automatic penalty and never proof. We do not claim to detect AI-written text, because no tool can do that reliably.",
        ne: "धेरै पाठ टाँसिएको, काम असामान्य रूपमा छिट्टै सकिएको वा दुई उत्तर लगभग उस्तै भएको भए हामी जनाउँछौं। यी मानिसले हेर्नका लागि सङ्केत मात्र हुन्, स्वतः दण्ड वा प्रमाण होइनन्। हामी AI ले लेखेको पाठ पत्ता लगाउँछौं भन्ने दाबी गर्दैनौं, किनकि कुनै उपकरणले यो भरपर्दो रूपमा गर्न सक्दैन।",
      },
    },
  ];

  if (evidence === "photos" || evidence === "all") {
    list.push({
      icon: "camera",
      by: "human",
      title: { en: "Photos of your work", ne: "कामका फोटो" },
      body: {
        en: "Rated by the employer themselves, not by AI, and shown separately from the score. Only this employer can see them. Location and camera details are removed, and photos are deleted automatically after 180 days. You can delete them any time.",
        ne: "AI ले होइन, रोजगारदाता आफैंले अंक दिन्छन्, र अंकभन्दा अलग देखाइन्छ। यो रोजगारदाताले मात्र हेर्न सक्छन्। स्थान र क्यामेराको विवरण हटाइन्छ, र फोटो १८० दिनपछि स्वतः मेटिन्छ। तपाईं जुनसुकै बेला मेट्न सक्नुहुन्छ।",
      },
    });
  }
  if (evidence === "video" || evidence === "all") {
    list.push({
      icon: "video",
      by: "human",
      title: { en: "Short demo video", ne: "छोटो डेमो भिडियो" },
      body: {
        en: "Asked only from shortlisted candidates, so a face on camera never affects the first round. A person watches and rates it on clarity, engagement and structure, separately from the score. No AI is used on video. Only this employer can watch it, it is deleted after 30 days, and you can delete it any time.",
        ne: "छनौट भएका उम्मेदवारसँग मात्र माग्छौं, त्यसैले क्यामेरामा देखिने अनुहारले पहिलो चरणलाई असर गर्दैन। मानिसले हेरेर स्पष्टता, संलग्नता र संरचनामा अंक दिन्छ, र अंकभन्दा अलग राखिन्छ। भिडियोमा AI प्रयोग हुँदैन। यो रोजगारदाताले मात्र हेर्न सक्छन्, ३० दिनमा मेटिन्छ, र तपाईं जुनसुकै बेला मेट्न सक्नुहुन्छ।",
      },
    });
  }

  list.push({
    icon: "eye-off",
    by: "none",
    title: { en: "Your identity", ne: "तपाईंको पहिचान" },
    body: {
      en: you
        ? "Employers see you only as a code like #A1B2 and your score. Your name and phone are revealed only if you tick the consent box, and you can take it back."
        : "You see applicants only as a code like #A1B2 and their score. Names and phones appear only if the candidate chooses to share them.",
      ne: you
        ? "रोजगारदाताले तपाईंलाई #A1B2 जस्तो कोड र अंकमात्र देख्छन्। तपाईंले सहमति जनाएमा मात्र नाम र फोन देखिन्छ, र फिर्ता लिन सकिन्छ।"
        : "तपाईंले उम्मेदवारलाई #A1B2 जस्तो कोड र अंकमात्र देख्नुहुन्छ। उम्मेदवारले साझा गर्न रोजेमा मात्र नाम र फोन देखिन्छ।",
    },
  });
  return list;
}

const BY: Record<Row["by"], { label: Record<Lang, string>; cls: string }> = {
  none: { label: { en: "No AI", ne: "AI होइन" }, cls: "badge-moss" },
  rules: { label: { en: "Keyword rules", ne: "शब्द-नियम" }, cls: "badge-moss" },
  ai: { label: { en: "AI", ne: "AI" }, cls: "badge-ochre" },
  human: { label: { en: "Human review", ne: "मानिसले जाँच" }, cls: "badge-brand" },
};

export default function ScoringExplainer({
  lang = "en",
  audience = "public",
  aiScoring = true,
  evidence = "none",
  title,
  aiUnavailable = false,
}: {
  /** The job uses AI but this result fell back to keyword rules. */
  aiUnavailable?: boolean;
  lang?: Lang;
  audience?: Audience;
  aiScoring?: boolean;
  /** "all" lists both photo and video rows (landing page). */
  evidence?: Evidence | "all";
  title?: string;
}) {
  const heading =
    title ??
    (lang === "ne" ? "कसरी अंक दिइन्छ र AI कहाँ प्रयोग हुन्छ" : "How scoring works, and where AI is used");

  return (
    <section className="card" aria-label={heading}>
      <h3 className="text-base font-semibold">{heading}</h3>
      <ul className="mt-4 space-y-4">
        {rows(audience, aiScoring, evidence, aiUnavailable).map((r) => (
          <li key={r.icon + r.title.en} className="flex gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper-dark text-ink-light">
              <Icon name={r.icon} size={18} />
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                {r.title[lang]}
                <span className={`${BY[r.by].cls} text-[10px]`}>{BY[r.by].label[lang]}</span>
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{r.body[lang]}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
