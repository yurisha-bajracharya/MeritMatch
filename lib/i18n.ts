import type { Lang } from "./types";

const strings = {
  language: { en: "Language", ne: "भाषा" },
  inputMode: { en: "How will you answer?", ne: "कसरी जवाफ दिनुहुन्छ?" },
  type: { en: "Type", ne: "टाइप" },
  voice: { en: "Speak", ne: "बोलेर" },
  minutes: { en: "{n} min", ne: "{n} मिनेट" },
  at: { en: "at", ne: "मा" },
  introBody: {
    en: "You will answer 3 short work situations. We score your answers, not your name or background. The employer does not see who you are until you agree.",
    ne: "तपाईंले ३ वटा छोटा कार्य परिस्थितिको जवाफ दिनुहुनेछ। हामी तपाईंका उत्तर जाँच्छौँ, नाम वा पृष्ठभूमि होइन। तपाईंले सहमति नदिएसम्म रोजगारदाताले तपाईं को हुनुहुन्छ भन्ने देख्दैनन्।",
  },
  start: { en: "Start the task", ne: "काम सुरु गर्नुहोस्" },
  situation: { en: "Situation {n} of {m}", ne: "परिस्थिति {n} / {m}" },
  timeLeft: { en: "Time left", ne: "बाँकी समय" },
  yourAnswer: { en: "Your answer", ne: "तपाईंको उत्तर" },
  placeholder: {
    en: "Write what you would say and do…",
    ne: "तपाईं के भन्नुहुन्छ र के गर्नुहुन्छ लेख्नुहोस्…",
  },
  back: { en: "Back", ne: "पछाडि" },
  next: { en: "Next", ne: "अर्को" },
  finish: { en: "Finish answers", ne: "उत्तर सक्नुहोस्" },
  timeUp: {
    en: "Time is up. Your answers so far will be sent.",
    ne: "समय सकियो। अहिलेसम्मका उत्तर पठाइनेछन्।",
  },
  startMic: { en: "Tap to speak", ne: "बोल्न थिच्नुहोस्" },
  stopMic: { en: "Stop", ne: "रोक्नुहोस्" },
  listening: { en: "Listening…", ne: "सुन्दै छु…" },
  voiceUnsupported: {
    en: "Voice is not available in this browser. Please type your answer.",
    ne: "यो ब्राउजरमा आवाज उपलब्ध छैन। कृपया टाइप गर्नुहोस्।",
  },
  voiceHint: {
    en: "You can edit the text after speaking.",
    ne: "बोलेपछि तपाईंले लेखाइ सम्पादन गर्न सक्नुहुन्छ।",
  },
  aboutYou: { en: "A little about you", ne: "तपाईंको बारेमा केही" },
  aboutYouNote: {
    en: "Your name and phone are only shared with the employer if you are shortlisted and say yes. Gender and area are used only for fairness reports, never for scoring.",
    ne: "तपाईंको नाम र फोन छनोटमा परेर तपाईंले हुन्छ भनेमा मात्र रोजगारदातालाई दिइन्छ। लिङ्ग र क्षेत्र निष्पक्षता प्रतिवेदनका लागि मात्र हुन्, अङ्कन गर्न होइन।",
  },
  name: { en: "Full name", ne: "पूरा नाम" },
  phone: { en: "Phone number", ne: "फोन नम्बर" },
  gender: { en: "Gender", ne: "लिङ्ग" },
  female: { en: "Woman", ne: "महिला" },
  male: { en: "Man", ne: "पुरुष" },
  other: { en: "Other / prefer not to say", ne: "अन्य / भन्न चाहन्न" },
  region: { en: "Where do you live?", ne: "तपाईं कहाँ बस्नुहुन्छ?" },
  urban: { en: "City or town", ne: "सहर वा बजार" },
  rural: { en: "Village or rural area", ne: "गाउँ वा ग्रामीण क्षेत्र" },
  submit: { en: "Send my answers", ne: "मेरा उत्तर पठाउनुहोस्" },
  sending: { en: "Sending…", ne: "पठाउँदै…" },
  errorGeneric: {
    en: "Could not send. Check your connection and try again.",
    ne: "पठाउन सकिएन। इन्टरनेट जाँचेर फेरि प्रयास गर्नुहोस्।",
  },
  errorDuplicate: {
    en: "You have already sent answers for this job.",
    ne: "तपाईंले यो कामका लागि पहिले नै उत्तर पठाइसक्नुभएको छ।",
  },
  errorFields: {
    en: "Please fill in every field. Phone needs at least 7 digits.",
    ne: "सबै ठाउँ भर्नुहोस्। फोनमा कम्तीमा ७ अङ्क चाहिन्छ।",
  },
  doneTitle: { en: "Answers received", ne: "उत्तर प्राप्त भयो" },
  doneBlind: {
    en: "Your answers are being reviewed blindly.",
    ne: "तपाईंका उत्तर नाम नदेखिने गरी जाँचिँदैछन्।",
  },
  doneStamp: { en: "DONE", ne: "सम्पन्न" },
  nextHeading: { en: "What happens next", ne: "अब के हुन्छ" },
  next1: {
    en: "Your answers are scored against the same checklist as everyone else.",
    ne: "तपाईंका उत्तर अरू सबैजस्तै एउटै मापदण्डमा जाँचिन्छन्।",
  },
  next2: {
    en: "The employer sees ranked scores and reasons, with names hidden.",
    ne: "रोजगारदाताले नाम लुकाइएका अङ्क र कारणसहितको क्रमबद्ध सूची देख्छन्।",
  },
  next3: {
    en: "If you are shortlisted, you get a message and choose whether to share your contact details.",
    ne: "तपाईं छनोटमा परेमा सन्देश आउँछ र सम्पर्क विवरण दिने कि नदिने तपाईंले निर्णय गर्नुहुन्छ।",
  },
  viewResult: { en: "Check your result", ne: "आफ्नो नतिजा हेर्नुहोस्" },
  resultNote: { en: "Save this link to check your result later.", ne: "पछि नतिजा हेर्न यो लिङ्क सुरक्षित राख्नुहोस्।" },
  outcomeYes: { en: "You are shortlisted", ne: "तपाईं छनोटमा पर्नुभयो" },
  outcomeNo: { en: "Not shortlisted this time", ne: "यसपटक छनोटमा पर्नुभएन" },
  shortStamp: { en: "TOP", ne: "छनोट" },
  smsYes: {
    en: "MeritMatch: {name}, your answers for {title} at {employer} were among the strongest. You are shortlisted. Open the link to choose whether to share your contact details.",
    ne: "मेरिटम्याच: {name}, {employer} को {title} का लागि तपाईंका उत्तर उत्कृष्टमध्ये परे। तपाईं छनोटमा पर्नुभयो। सम्पर्क विवरण दिने कि नदिने रोज्न लिङ्क खोल्नुहोस्।",
  },
  smsNo: {
    en: "MeritMatch: {name}, thank you for completing the task for {title} at {employer}. You were not shortlisted this time. See other jobs that fit your skills.",
    ne: "मेरिटम्याच: {name}, {employer} को {title} को काम पूरा गर्नुभएकोमा धन्यवाद। यसपटक तपाईं छनोटमा पर्नुभएन। तपाईंका सीपसँग मिल्ने अन्य काम हेर्नुहोस्।",
  },
  consentHeading: { en: "Share your contact details?", ne: "सम्पर्क विवरण दिने?" },
  consentLabel: { en: "Let {employer} see my name and phone number", ne: "{employer} ले मेरो नाम र फोन नम्बर हेर्न सकून्" },
  consentOn: { en: "Shared. You can turn this off any time.", ne: "दिइएको छ। तपाईं जुनसुकै बेला बन्द गर्न सक्नुहुन्छ।" },
  consentOff: { en: "Not shared. {employer} cannot see who you are.", ne: "दिइएको छैन। {employer} ले तपाईं को हुनुहुन्छ देख्दैनन्।" },
  consentError: { en: "Could not save. Try again.", ne: "सुरक्षित गर्न सकिएन। फेरि प्रयास गर्नुहोस्।" },
  skillsShown: { en: "Skills your answers showed", ne: "तपाईंका उत्तरले देखाएका सीप" },
  noSkillsYet: { en: "No strong skill signals yet. Try the Career-Break Translator to add your past work.", ne: "अहिलेसम्म स्पष्ट सीप देखिएन। विगतको काम थप्न करियर-ब्रेक अनुवादक प्रयोग गर्नुहोस्।" },
  similarJobs: { en: "Similar jobs for you", ne: "तपाईंका लागि मिल्दा कामहरू" },
  similarCta: { en: "See similar jobs", ne: "मिल्दा काम हेर्नुहोस्" },
  matchingSkills: { en: "Matches your skills in {tags}", ne: "{tags} मा तपाईंका सीपसँग मिल्छ" },
  noSimilar: { en: "No matching jobs yet. Check again soon.", ne: "अहिले मिल्दो काम छैन। केही समयपछि फेरि हेर्नुहोस्।" },
  backToResult: { en: "Back to your result", ne: "नतिजामा फर्कनुहोस्" },
  yourSkills: { en: "Your skills", ne: "तपाईंका सीप" },
} as const;

export type StringKey = keyof typeof strings;

export function t(
  lang: Lang,
  key: StringKey,
  vars?: Record<string, string | number>,
): string {
  let s: string = strings[key][lang];
  for (const [k, v] of Object.entries(vars ?? {}))
    s = s.replace(`{${k}}`, String(v));
  return s;
}

/** Nepali numerals for the timer and counters when reading in Nepali. */
export function localizeDigits(value: string | number, lang: Lang): string {
  const s = String(value);
  if (lang === "en") return s;
  return s.replace(/\d/g, (d) => "०१२३४५६७८९"[Number(d)]);
}
