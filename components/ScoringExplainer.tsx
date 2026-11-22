import Icon, { type IconName } from "./Icon";
import { MCQ_WEIGHT } from "@/lib/mcq";
import type { Evidence, Lang } from "@/lib/types";

/**
 * Plain-language answer to "how is this scored, and where is AI used?".
 * Shown to candidates before they start, to employers on the ranking page and
 * when posting, and on the landing page. It describes what the code really
 * does, so keep it in step with lib/scoring.ts, lib/mcq.ts, lib/aidetect.ts,
 * lib/media.ts and the reveal rules in lib/shortlist.ts.
 *
 * Layout: the 30/70 split first (what the number is made of), then every step
 * grouped by WHO does it (no AI, AI-assisted, a person), then privacy.
 */

type Audience = "candidate" | "employer" | "public";
type Process = "none" | "ai" | "human";
type Item = { icon: IconName; title: Record<Lang, string>; body: Record<Lang, string>; by: Process };

const pct = Math.round(MCQ_WEIGHT * 100);
const L = (en: string, ne: string): Record<Lang, string> => ({ en, ne });

function items(who: Audience, aiScoring: boolean, evidence: Evidence | "all", aiUnavailable: boolean): Item[] {
  const you = who === "candidate";
  const list: Item[] = [
    {
      icon: "list-check",
      by: "none",
      title: L(`Choice questions, ${pct}%`, `छनोट प्रश्न, ${pct}%`),
      body: L(
        "Real workplace situations with one best answer, marked against a fixed answer key. The same answers always get the same mark.",
        "कामको वास्तविक अवस्था र एउटा सबैभन्दा राम्रो उत्तर, निश्चित उत्तरपुस्तिकासँग जाँचिन्छ। एउटै उत्तरले सधैं उही अंक पाउँछ।",
      ),
    },
  ];

  if (aiScoring && !aiUnavailable) {
    list.push({
      icon: "sparkles",
      by: "ai",
      title: L(`Written answers, ${100 - pct}%`, `लिखित उत्तर, ${100 - pct}%`),
      body: you
        ? L(
            "An AI model reads your answers against the job's scoring guide and gives a reason for each mark. Only your answer text is sent; phone numbers and emails you type are removed first. Spelling and grammar are not judged.",
            "AI मोडेलले तपाईंका उत्तर जागिरको अंक-मार्गदर्शनसँग पढ्छ र हरेक अंकको कारण दिन्छ। उत्तरको पाठ मात्र पठाइन्छ; लेखेको फोन नम्बर वा इमेल पहिले नै हटाइन्छ। हिज्जे र व्याकरण जाँचिँदैन।",
          )
        : L(
            "An AI model reads each answer against the scoring guide and gives a reason for each mark. Only the answer text is sent; contact details typed into an answer are removed first. Spelling and grammar are not judged.",
            "AI मोडेलले प्रत्येक उत्तर अंक-मार्गदर्शनसँग पढ्छ र हरेक अंकको कारण दिन्छ। उत्तरको पाठ मात्र पठाइन्छ; उत्तरमा लेखिएका सम्पर्क विवरण पहिले नै हटाइन्छ। हिज्जे र व्याकरण जाँचिँदैन।",
          ),
    });
  } else {
    list.push({
      icon: "pen",
      by: "none",
      title: L(`Written answers, ${100 - pct}%`, `लिखित उत्तर, ${100 - pct}%`),
      body: aiUnavailable
        ? L(
            "This job uses AI marking, but the AI service was not available for this submission, so simple keyword rules on our own server were used. Nothing was sent to an AI service. Keyword rules are less nuanced.",
            "यो कामले AI जाँच प्रयोग गर्छ, तर यो पेशका लागि AI सेवा उपलब्ध थिएन, त्यसैले हाम्रै सर्भरका साधारण शब्द-नियम प्रयोग गरियो। कुनै AI सेवामा केही पठाइएन। शब्द-नियम कम सूक्ष्म हुन्छन्।",
          )
        : L(
            "AI marking is off for this job. Written answers are scored by simple keyword rules on our own server and nothing is sent to an AI service. This is less nuanced than AI marking.",
            "यो कामका लागि AI जाँच बन्द छ। लिखित उत्तर हाम्रै सर्भरमा साधारण शब्द-नियमले जाँचिन्छ र कुनै AI सेवामा केही पठाइँदैन। यो AI जाँचभन्दा कम सूक्ष्म हुन्छ।",
          ),
    });
  }

  list.push({
    icon: "alert",
    by: "none",
    title: L("Honesty notes", "इमान्दारी सङ्केत"),
    body: L(
      "Pasted text, unusually fast work or near-identical answers are noted for the employer to look at. If an AI-writing check is switched on, it only adds a note, skips Nepali answers, and can be wrong for people writing in a second language. Notes never change the score and are never proof.",
      "धेरै टाँसिएको पाठ, असामान्य रूपमा छिटो काम वा लगभग उस्तै उत्तर रोजगारदाताले हेर्न जनाइन्छ। AI-लेखन जाँच चालु भए त्यसले टिप्पणी मात्र थप्छ, नेपाली उत्तर छोड्छ, र दोस्रो भाषामा लेख्नेलाई गलत ठम्याउन सक्छ। टिप्पणीले अंक कहिल्यै बदल्दैन र प्रमाण होइन।",
    ),
  });

  if (evidence === "photos" || evidence === "all") {
    list.push({
      icon: "camera",
      by: "human",
      title: L("Photos of your work", "कामका फोटो"),
      body: L(
        "Rated by the employer, not by AI, and kept separate from the score. Only that employer can see them.",
        "AI ले होइन, रोजगारदाताले अंक दिन्छन्, र अंकभन्दा अलग राखिन्छ। त्यो रोजगारदाताले मात्र हेर्न सक्छन्।",
      ),
    });
  }
  if (evidence === "video" || evidence === "all") {
    list.push({
      icon: "video",
      by: "human",
      title: L("Short demo video", "छोटो डेमो भिडियो"),
      body: L(
        "Asked only from shortlisted people, so a face on camera never affects the first round. A person rates it; no AI is used on video.",
        "छनौट भएकासँग मात्र माग्छौं, त्यसैले क्यामेरामा देखिने अनुहारले पहिलो चरणलाई असर गर्दैन। मानिसले अंक दिन्छ; भिडियोमा AI प्रयोग हुँदैन।",
      ),
    });
  }
  list.push({
    icon: "check-circle",
    by: "human",
    title: L("Shortlist and interview", "छनौट र अन्तर्वार्ता"),
    body: L(
      "A person at the employer decides who to shortlist, reject or invite to interview. The ranking only suggests.",
      "कसलाई छनौट, अस्वीकार वा अन्तर्वार्तामा बोलाउने भन्ने रोजगारदाताका मानिसले निर्णय गर्छन्। क्रमले सुझाव मात्र दिन्छ।",
    ),
  });
  return list;
}

const GROUPS: { by: Process; label: Record<Lang, string>; hint: Record<Lang, string>; mark: string }[] = [
  {
    by: "none",
    label: L("No AI", "AI बिना"),
    hint: L("Fixed rules on our own server", "हाम्रै सर्भरका निश्चित नियम"),
    mark: "bg-moss",
  },
  {
    by: "ai",
    label: L("AI-assisted", "AI को सहयोगमा"),
    hint: L("An AI model reads, with reasons shown", "AI मोडेलले पढ्छ, कारणसहित"),
    mark: "bg-[#E0A245]",
  },
  {
    by: "human",
    label: L("Human review", "मानिसले जाँच"),
    hint: L("A person at the employer decides", "रोजगारदाताका मानिसले निर्णय गर्छन्"),
    mark: "bg-brand",
  },
];

function privacy(who: Audience): Record<Lang, string>[] {
  const you = who === "candidate";
  return [
    you
      ? L(
          "Employers see you as a code like #A1B2. Your name and phone stay hidden until they shortlist you, you agree, and they unlock your contact.",
          "रोजगारदाताले तपाईंलाई #A1B2 जस्तो कोडमा देख्छन्। उनले छनौट गर्ने, तपाईंले सहमति दिने र उनले सम्पर्क खोल्ने बेलासम्म नाम र फोन लुकेको रहन्छ।",
        )
      : L(
          "Applicants appear as a code like #A1B2. Name and phone stay hidden until the employer shortlists, the candidate agrees, and the contact is unlocked.",
          "आवेदक #A1B2 जस्तो कोडमा देखिन्छन्। रोजगारदाताले छनौट गर्ने, उम्मेदवारले सहमति दिने र सम्पर्क खोल्ने बेलासम्म नाम र फोन लुकेको रहन्छ।",
        ),
    L(
      "Name, phone, gender and region are never sent to an AI service.",
      "नाम, फोन, लिङ्ग र क्षेत्र कुनै AI सेवामा कहिल्यै पठाइँदैन।",
    ),
    L(
      "Photo location and camera details are removed. Photos are deleted after 180 days, videos after 30, or any time on request.",
      "फोटोको स्थान र क्यामेरा विवरण हटाइन्छ। फोटो १८० दिनमा, भिडियो ३० दिनमा, वा अनुरोधमा जुनसुकै बेला मेटिन्छ।",
    ),
  ];
}

export default function ScoringExplainer({
  lang = "en",
  audience = "public",
  aiScoring = true,
  evidence = "none",
  title,
  aiUnavailable = false,
  bare = false,
}: {
  /** The job uses AI but this result fell back to keyword rules. */
  aiUnavailable?: boolean;
  lang?: Lang;
  audience?: Audience;
  aiScoring?: boolean;
  /** "all" lists both photo and video rows (landing page). */
  evidence?: Evidence | "all";
  title?: string;
  /** No card border or heading (when the page supplies its own section). */
  bare?: boolean;
}) {
  const heading =
    title ?? (lang === "ne" ? "कसरी अंक दिइन्छ र AI कहाँ प्रयोग हुन्छ" : "How scoring works, and where AI is used");
  const list = items(audience, aiScoring, evidence, aiUnavailable);
  const writtenByAi = aiScoring && !aiUnavailable;

  return (
    <section className={bare ? "" : "card"} aria-label={heading}>
      {!bare && <h2 className="text-xl font-semibold text-ink">{heading}</h2>}

      {/* What the score is made of */}
      <div className={bare ? "" : "mt-5"}>
        <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
          <div className="bg-moss" style={{ width: `${pct}%` }} />
          <div className={writtenByAi ? "bg-[#E0A245]" : "bg-moss/70"} style={{ width: `${100 - pct}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-[3fr_7fr] gap-4 text-sm">
          <div>
            <p className="text-2xl font-semibold text-ink">{pct}%</p>
            <p className="text-ink-light">{lang === "ne" ? "छनोट प्रश्न, AI बिना" : "Choice questions, no AI"}</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-ink">{100 - pct}%</p>
            <p className="text-ink-light">
              {writtenByAi
                ? lang === "ne"
                  ? "लिखित उत्तर, AI को सहयोगमा"
                  : "Written answers, AI-assisted"
                : lang === "ne"
                  ? "लिखित उत्तर, शब्द-नियमले"
                  : "Written answers, keyword rules"}
            </p>
          </div>
        </div>
      </div>

      {/* Who does what */}
      <div className="mt-8 divide-y divide-rule border-y border-rule">
        {GROUPS.map((g) => {
          const mine = list.filter((i) => i.by === g.by);
          if (mine.length === 0) return null;
          return (
            <div key={g.by} className="grid gap-3 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <div>
                <p className="flex items-center gap-2 text-base font-semibold text-ink">
                  <span className={`h-2.5 w-2.5 rounded-full ${g.mark}`} aria-hidden />
                  {g.label[lang]}
                </p>
                <p className="mt-0.5 text-sm text-ink-muted">{g.hint[lang]}</p>
              </div>
              <ul className="space-y-4">
                {mine.map((r) => (
                  <li key={r.title.en} className="flex gap-3">
                    <Icon name={r.icon} size={20} className="mt-0.5 text-ink-muted" />
                    <div className="min-w-0">
                      <p className="text-base font-medium text-ink">{r.title[lang]}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-light">{r.body[lang]}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Privacy */}
      <div className="mt-6 flex gap-3">
        <Icon name="lock" size={20} className="mt-0.5 text-ink-muted" />
        <div>
          <p className="text-base font-medium text-ink">
            {lang === "ne" ? "व्यक्तिगत जानकारी कसरी सुरक्षित रहन्छ" : "How personal information is protected"}
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-light marker:text-ink-muted">
            {privacy(audience).map((p) => (
              <li key={p.en}>{p[lang]}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
