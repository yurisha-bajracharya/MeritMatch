import type { Lang } from "./types";

/**
 * Strings for the employer side, notifications and the newer screens.
 * Same idea as lib/i18n.ts: every entry has BOTH languages, so a screen can
 * never end up half Nepali. `{name}` placeholders are filled by x().
 */
const S = {
  // employer ranking
  fairness: { en: "Fairness Dashboard", ne: "निष्पक्षता ड्यासबोर्ड" },
  backToRankings: { en: "Back to Rankings", ne: "क्रमबद्ध सूचीमा फर्कनुहोस्" },
  applicantsCount: { en: "{n} applicants", ne: "{n} आवेदक" },
  noApplicants: {
    en: "No applicants yet. Share your job link to get started.",
    ne: "अहिलेसम्म कुनै आवेदक छैन। सुरु गर्न आफ्नो कामको लिंक साझा गर्नुहोस्।",
  },
  tabShortlisted: { en: "Shortlisted ({n})", ne: "छनौट भएका ({n})" },
  tabAll: { en: "All applicants ({n})", ne: "सबै आवेदक ({n})" },
  noneShortlisted: {
    en: "You have not shortlisted anyone yet. Use the Shortlist button on a candidate.",
    ne: "तपाईंले अहिलेसम्म कसैलाई छनौट गर्नुभएको छैन। उम्मेदवारमा रहेको छनौट बटन प्रयोग गर्नुहोस्।",
  },
  onlyShortlistedNote: {
    en: "Showing only the people you shortlisted. They have been notified.",
    ne: "तपाईंले छनौट गरेका मानिस मात्र देखाइँदैछ। उनीहरूलाई सूचना गइसकेको छ।",
  },
  shortlist: { en: "Shortlist", ne: "छनौट गर्नुहोस्" },
  removeShortlist: { en: "Remove from shortlist", ne: "छनौटबाट हटाउनुहोस्" },
  shortlistedBadge: { en: "Shortlisted", ne: "छनौट भयो" },
  suggestedBadge: { en: "Suggested", ne: "सुझाइएको" },
  suggestedHint: {
    en: "Suggested = in the top quarter by score. It is only a hint. Candidates are told they are shortlisted only when you press Shortlist.",
    ne: "सुझाइएको = अंकमा माथिल्लो चौथाइमा। यो सङ्केत मात्र हो। तपाईंले छनौट बटन थिच्दा मात्र उम्मेदवारलाई छनौट भएको जानकारी जान्छ।",
  },
  saving: { en: "Saving…", ne: "सुरक्षित गर्दै…" },
  couldNotSave: {
    en: "Could not save. Are you logged in as this job's employer?",
    ne: "सुरक्षित गर्न सकिएन। तपाईं यो कामका रोजगारदाताका रूपमा लगइन हुनुहुन्छ?",
  },
  closerLook: { en: "Worth a closer look", ne: "नजिकबाट हेर्न लायक" },
  closerLookHint: {
    en: "A signal, not proof. Consider asking a short follow-up question before deciding.",
    ne: "यो सङ्केत मात्र हो, प्रमाण होइन। निर्णय गर्नु अघि छोटो थप प्रश्न सोध्ने विचार गर्नुहोस्।",
  },
  flagPasted: {
    en: "About {pct}% of the text was pasted in rather than typed.",
    ne: "पाठको करिब {pct}% टाइप गरिएको नभई टाँसिएको थियो।",
  },
  flagFast: {
    en: "{words} words in {min} min (~{wpm} words/min), faster than usual typing plus thinking.",
    ne: "{min} मिनेटमा {words} शब्द (~{wpm} शब्द/मिनेट), सामान्य टाइपिङ र सोचाइभन्दा छिटो।",
  },
  flagLate: {
    en: "Submitted {over} min after the {limit}-minute timer ended.",
    ne: "{limit} मिनेटको टाइमर सकिएको {over} मिनेटपछि पेश गरियो।",
  },
  flagAi: {
    en: "An AI detector rated this text {pct}% likely to be AI-written. Detectors often wrongly flag people writing in a second language, so ask about it rather than reject.",
    ne: "एआई जाँचकले यो पाठ {pct}% सम्भावनाले एआईले लेखेको भन्यो। दोस्रो भाषामा लेख्नेलाई यस्ता जाँचकले प्रायः गलत ठम्याउँछन्, त्यसैले अस्वीकार गर्नुभन्दा उनलाई सोध्नुहोस्।",
  },
  flagSimilar: {
    en: "{pct}% of its wording matches {other}.",
    ne: "यसको {pct}% शब्दावली {other} सँग मिल्छ।",
  },
  choices: { en: "Choices {a}/{b} ({w}%)", ne: "छनोट {a}/{b} ({w}%)" },
  written: { en: "Written {a}% ({w}%)", ne: "लिखित {a}% ({w}%)" },
  fitPreferred: { en: "Wants this city", ne: "यही शहर चाहन्छ" },
  fitAnywhere: { en: "Open to anywhere", ne: "जुनसुकै ठाउँ मञ्जुर" },
  fitElsewhere: { en: "Prefers another city", ne: "अर्को शहर रुचाउँछ" },
  identityRevealed: { en: "Identity revealed", ne: "पहिचान खुलासा" },
  waitingConsent: {
    en: "Waiting for candidate consent to reveal identity",
    ne: "पहिचान देखाउन उम्मेदवारको सहमतिको प्रतीक्षा",
  },
  privateMedia: {
    en: "Photos and video are private to the employer who posted this job.",
    ne: "फोटो र भिडियो यो काम पोस्ट गर्ने रोजगारदाताले मात्र हेर्न सक्छन्।",
  },
  howScored: { en: "How these scores were produced", ne: "यी अंक कसरी निकालिए" },

  // evidence review
  photosOfWork: { en: "Photos of work", ne: "कामका फोटो" },
  demoVideo: { en: "Demo video", ne: "डेमो भिडियो" },
  humanReview: { en: "Human review", ne: "मानिसले जाँच" },
  saveRating: { en: "Save rating", ne: "अंक सुरक्षित गर्नुहोस्" },
  savedRating: { en: "Saved", ne: "सुरक्षित भयो" },
  notInScore: { en: "Not part of the score or rank.", ne: "अंक वा क्रमको हिस्सा होइन।" },
  finish: { en: "Finish and neatness", ne: "सिलाइ र सफाइ" },
  technique: { en: "Technique", ne: "सीप" },
  fit: { en: "Fit to the brief", ne: "मागसँग मिल्ने" },
  clarity: { en: "Clarity", ne: "स्पष्टता" },
  engagement: { en: "Engagement", ne: "संलग्नता" },
  structure: { en: "Structure", ne: "संरचना" },

  // fairness page
  answersTitle: { en: "Their answers", ne: "उनका उत्तरहरू" },
  noAnswer: { en: "(no answer)", ne: "(उत्तर छैन)" },
  noFlags: { en: "No review notes: nothing unusual was seen in how this was written.", ne: "कुनै समीक्षा टिप्पणी छैन: लेख्ने तरिकामा केही असामान्य देखिएन।" },
  questionsTitle: { en: "Questions in this task ({n})", ne: "यो कार्यका प्रश्नहरू ({n})" },
  questionsHint: { en: "Template questions first, then the ones you added.", ne: "पहिले टेम्प्लेटका प्रश्न, त्यसपछि तपाईंले थपेका।" },
  mine: { en: "Added by you", ne: "तपाईंले थपेको" },
  reject: { en: "Reject", ne: "अस्वीकार गर्नुहोस्" },
  undoReject: { en: "Undo reject", ne: "अस्वीकार फिर्ता लिनुहोस्" },
  rejectedBadge: { en: "Rejected", ne: "अस्वीकृत" },
  tabRejected: { en: "Rejected ({n})", ne: "अस्वीकृत ({n})" },
  noneRejected: { en: "Nobody rejected yet.", ne: "अहिलेसम्म कसैलाई अस्वीकार गरिएको छैन।" },
  myJobs: { en: "My jobs", ne: "मेरा कामहरू" },
  myJobsTitle: { en: "Your posted jobs", ne: "तपाईंले पोस्ट गरेका कामहरू" },
  myJobsSub: { en: "Open a job to see who applied, shortlist or reject.", ne: "कसले आवेदन दियो हेर्न, छनौट वा अस्वीकार गर्न काम खोल्नुहोस्।" },
  noJobsYet: { en: "You have not posted a job yet.", ne: "तपाईंले अहिलेसम्म कुनै काम पोस्ट गर्नुभएको छैन।" },
  postFirstJob: { en: "Post a job", ne: "काम पोस्ट गर्नुहोस्" },
  viewApplicants: { en: "View applicants", ne: "आवेदकहरू हेर्नुहोस्" },
  statApplicants: { en: "Applicants", ne: "आवेदक" },
  statShortlisted: { en: "Shortlisted", ne: "छनौट" },
  statRejected: { en: "Rejected", ne: "अस्वीकृत" },
  statPending: { en: "To review", ne: "हेर्न बाँकी" },
  shareTaskLink: { en: "Candidate link", ne: "उम्मेदवारको लिंक" },
  idVerified: { en: "ID verified", ne: "परिचयपत्र प्रमाणित" },
  idVerifiedHint: {
    en: "A MeritMatch reviewer checked that a government ID matches this person's account name. You never see the ID itself, and the name only after you shortlist, they agree and you unlock.",
    ne: "मेरिटम्याचका समीक्षकले सरकारी परिचयपत्र यो व्यक्तिको खाताको नामसँग मिल्छ भनेर जाँचे। तपाईं परिचयपत्र कहिल्यै देख्नुहुन्न, नाम पनि छनौट, सहमति र सम्पर्क खोलेपछि मात्र।",
  },
  skillsTitle: { en: "Skills", ne: "सीपहरू" },
  skillsThisTask: { en: "Shown in this task (scored 6/10 or more)", ne: "यो कार्यमा देखाएका (१० मा ६ वा बढी)" },
  skillsEarlier: { en: "Shown in earlier tasks", ne: "पहिलेका कार्यमा देखाएका" },
  skillsNoneYet: { en: "No skill reached 6/10 in this task.", ne: "यो कार्यमा कुनै सीप १० मा ६ पुगेन।" },
  trackTitle: { en: "Track record on other jobs", ne: "अरू कामहरूमा अनुभव" },
  trackNone: { en: "No other scored tasks yet. This is their first.", ne: "अरू कुनै अंक पाएको कार्य छैन। यो उनको पहिलो हो।" },
  trackSummary: { en: "{n} scored tasks, average {avg}%", ne: "{n} वटा अंकित कार्य, औसत {avg}%" },
  trackProven: { en: "Proven on tasks", ne: "कार्यमा प्रमाणित" },
  trackClaimed: { en: "Described by them, not yet proven", ne: "उनले भनेका, अझै प्रमाणित भएका छैनन्" },
  trackRecent: { en: "Recent work", ne: "हालैका कार्य" },
  trackAnon: { en: "No employer or personal details are shown.", ne: "कुनै रोजगारदाता वा व्यक्तिगत विवरण देखाइँदैन।" },
  inviteInterview: { en: "Invite to interview", ne: "अन्तर्वार्तामा बोलाउनुहोस्" },
  interviewNotePh: { en: "When and where? (optional, e.g. Monday 11 am, Himal Mart)", ne: "कहिले र कहाँ? (ऐच्छिक, जस्तै सोमबार ११ बजे, हिमाल मार्ट)" },
  sendInvite: { en: "Send invitation", ne: "निम्तो पठाउनुहोस्" },
  interviewInvitedBadge: { en: "Interview invited", ne: "अन्तर्वार्ताको निम्तो" },
  cancelInvite: { en: "Cancel invitation", ne: "निम्तो रद्द गर्नुहोस्" },
  interviewTitle: { en: "You are invited to an interview", ne: "तपाईंलाई अन्तर्वार्ताको निम्तो आएको छ" },
  interviewBody: { en: "{employer} would like to interview you for {title}.", ne: "{employer} ले {title} को लागि तपाईंको अन्तर्वार्ता लिन चाहन्छ।" },
  interviewCardTitle: { en: "Interview invitation", ne: "अन्तर्वार्ताको निम्तो" },
  interviewCardBody: { en: "The employer would like to interview you.", ne: "रोजगारदाताले तपाईंको अन्तर्वार्ता लिन चाहन्छ।" },
  unlockContact: { en: "Unlock contact (Rs {price}, demo payment)", ne: "सम्पर्क खोल्नुहोस् (रु {price}, डेमो भुक्तानी)" },
  unlockFree: { en: "Unlock contact (free for your account)", ne: "सम्पर्क खोल्नुहोस् (तपाईंको खातामा निःशुल्क)" },
  unlocking: { en: "Unlocking...", ne: "खोल्दै..." },
  agreedLocked: { en: "They agreed to share their details. Unlock to see name and phone.", ne: "उनले विवरण दिन सहमति दिएका छन्। नाम र फोन हेर्न सम्पर्क खोल्नुहोस्।" },
  needShortlistFirst: { en: "Name and phone stay hidden until you shortlist, they agree, and you unlock.", ne: "छनौट गर्ने, उनले सहमति दिने र तपाईंले खोल्ने बेलासम्म नाम र फोन लुकेको रहन्छ।" },
  noFace: { en: "Tip: photograph the work itself. Please keep faces out of the photos.", ne: "सुझाव: कामकै फोटो खिच्नुहोस्। फोटोमा अनुहार नपारिदिनुहोला।" },
  totalApplicants: { en: "Total applicants", ne: "जम्मा आवेदक" },
  shortlistedCount: { en: "Shortlisted", ne: "छनौट भएका" },
  poolLine: { en: "Women {w}%, Rural {r}%", ne: "महिला {w}%, ग्रामीण {r}%" },

  // notifications
  newJobTitle: { en: "New job: {title}", ne: "नयाँ काम: {title}" },
  newJobBody: { en: "{employer}{place}, matches your skills", ne: "{employer}{place}, तपाईंका सीपसँग मिल्छ" },
  shortlistedTitle: { en: "You have been shortlisted", ne: "तपाईं छनौटमा पर्नुभयो" },
  shortlistedBody: {
    en: "{employer} shortlisted you for {title}. Open your result to see what comes next.",
    ne: "{employer} ले तपाईंलाई {title} का लागि छनौट गर्नुभयो। अर्को चरण हेर्न नतिजा खोल्नुहोस्।",
  },
  notificationsLabel: { en: "Notifications", ne: "सूचनाहरू" },

  // dashboard + misc
  welcomeBack: { en: "Welcome back, {name}!", ne: "फेरि स्वागत छ, {name}!" },
  there: { en: "there", ne: "साथी" },
  remove: { en: "Remove", ne: "हटाउनुहोस्" },
  posted: { en: "Posted", ne: "पोस्ट भयो" },
  done: { en: "Done", ne: "सकियो" },
  shareLink: { en: "Share this link with candidates:", ne: "यो लिंक उम्मेदवारहरूसँग साझा गर्नुहोस्:" },
  questionN: { en: "Question {n}", ne: "प्रश्न {n}" },
  phShopAssistant: { en: "e.g. Shop Assistant", ne: "जस्तै: पसल सहायक" },
  phCompany: { en: "e.g. Himal Mart", ne: "जस्तै: हिमाल मार्ट" },
  phTags: { en: "e.g. customer-service, numeracy", ne: "जस्तै: ग्राहक-सेवा, गणना" },
  errLoginEmployer: {
    en: "Log in as an employer to ask for photos or video.",
    ne: "फोटो वा भिडियो माग्न रोजगारदाताका रूपमा लगइन गर्नुहोस्।",
  },
  errChooseCity: {
    en: "Choose a city from the list so candidates can be matched by place.",
    ne: "ठाउँका आधारमा मिलाउन सूचीबाट एउटा शहर छान्नुहोस्।",
  },
  errNoAccount: { en: "No account with this phone number. Sign up first.", ne: "यो फोन नम्बरको खाता छैन। पहिले साइन अप गर्नुहोस्।" },
  errRoleTakenEmployer: { en: "This phone number is already registered as an employer. Log in instead, or use a different number.", ne: "यो फोन नम्बर पहिले नै रोजगारदाताको रूपमा दर्ता छ। लग इन गर्नुहोस्, वा अर्को नम्बर प्रयोग गर्नुहोस्।" },
  errRoleTakenCandidate: { en: "This phone number is already registered as a job seeker. Log in instead, or use a different number.", ne: "यो फोन नम्बर पहिले नै रोजगार खोज्नेको रूपमा दर्ता छ। लग इन गर्नुहोस्, वा अर्को नम्बर प्रयोग गर्नुहोस्।" },
  errAlready: { en: "You have already submitted this task.", ne: "तपाईंले यो कार्य पहिले नै पेश गरिसक्नुभएको छ।" },
  verified: { en: "Verified", ne: "प्रमाणित" },
  stillReview: { en: "Under review", ne: "समीक्षामा" },
  stillReviewHint: {
    en: "The employer has not shortlisted anyone yet. You will get a notification if you are shortlisted.",
    ne: "रोजगारदाताले अहिलेसम्म कसैलाई छनौट गर्नुभएको छैन। छनौट भएमा तपाईंलाई सूचना आउनेछ।",
  },
  notShortlistedYet: { en: "Not shortlisted yet", ne: "अझै छनौट भएको छैन" },
  statusHint: {
    en: "Only the employer can shortlist. This can change as they review more applicants.",
    ne: "रोजगारदाताले मात्र छनौट गर्न सक्छन्। थप आवेदक हेरेपछि यो परिवर्तन हुन सक्छ।",
  },
  shortlistedMsg: {
    en: "The employer shortlisted you.",
    ne: "रोजगारदाताले तपाईंलाई छनौट गर्नुभयो।",
  },
} as const;

export type XKey = keyof typeof S;

export function x(key: XKey, lang: Lang, vars?: Record<string, string | number>): string {
  let out: string = S[key][lang] ?? S[key].en;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}

/** Write an integrity flag in the reader's language, falling back to the stored English. */
export function flagText(
  flag: { code: string; note: string; data?: Record<string, number | string> },
  lang: Lang,
): string {
  const d = flag.data;
  if (!d) return flag.note;
  const key = ({ pasted: "flagPasted", fast: "flagFast", late: "flagLate", similar: "flagSimilar", ai: "flagAi" } as const)[
    flag.code as "pasted" | "fast" | "late" | "similar" | "ai"
  ];
  return key ? x(key, lang, d as Record<string, string | number>) : flag.note;
}
