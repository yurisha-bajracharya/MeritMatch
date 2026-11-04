import type { Lang } from "./types";

const strings: Record<string, Record<Lang, string>> = {
  // -- App-wide --
  appName: { en: "MeritMatch", ne: "मेरिटम्याच" },
  tagline: { en: "Nepal's merit-based hiring platform", ne: "नेपालको योग्यता-आधारित भर्ना प्लेटफर्म" },
  heroSub: {
    en: "Fair hiring through anonymous work-sample tasks — no résumé, no network, just your skills.",
    ne: "गुमनाम कार्य-नमूना कार्यहरू मार्फत निष्पक्ष भर्ना — बायोडाटा छैन, सिफारिस छैन, सीप मात्र।",
  },
  getStarted: { en: "Get Started", ne: "सुरु गर्नुहोस्" },
  login: { en: "Log In", ne: "लग इन" },
  signUp: { en: "Sign Up", ne: "साइन अप" },
  logout: { en: "Log Out", ne: "लग आउट" },
  dashboard: { en: "Dashboard", ne: "ड्यासबोर्ड" },
  profile: { en: "Profile", ne: "प्रोफाइल" },
  save: { en: "Save", ne: "सुरक्षित गर्नुहोस्" },
  cancel: { en: "Cancel", ne: "रद्द गर्नुहोस्" },
  submit: { en: "Submit", ne: "पेश गर्नुहोस्" },
  next: { en: "Next", ne: "अर्को" },
  back: { en: "Back", ne: "पछाडि" },
  loading: { en: "Loading…", ne: "लोड हुँदैछ…" },
  error: { en: "Something went wrong", ne: "केही गल्ती भयो" },
  english: { en: "English", ne: "अंग्रेजी" },
  nepali: { en: "नेपाली", ne: "नेपाली" },
  langToggle: { en: "नेपाली", ne: "English" },

  // -- Auth / Signup --
  signupTitle: { en: "Create Your Profile", ne: "आफ्नो प्रोफाइल बनाउनुहोस्" },
  signupSub: { en: "Tell us a bit about yourself to get started.", ne: "सुरु गर्न आफ्नो बारेमा थोरै बताउनुहोस्।" },
  fullName: { en: "Full Name", ne: "पूरा नाम" },
  phone: { en: "Phone Number", ne: "फोन नम्बर" },
  email: { en: "Email (optional)", ne: "इमेल (ऐच्छिक)" },
  iAmA: { en: "I am a…", ne: "म…" },
  jobSeeker: { en: "Job Seeker", ne: "काम खोज्ने" },
  employer: { en: "Employer", ne: "रोजगारदाता" },
  gender: { en: "Gender (optional, for fairness stats)", ne: "लिङ्ग (ऐच्छिक, निष्पक्षता तथ्याङ्कको लागि)" },
  female: { en: "Female", ne: "महिला" },
  male: { en: "Male", ne: "पुरुष" },
  other: { en: "Other", ne: "अन्य" },
  region: { en: "Region", ne: "क्षेत्र" },
  urban: { en: "Urban", ne: "शहरी" },
  rural: { en: "Rural", ne: "ग्रामीण" },
  createAccount: { en: "Create Account", ne: "खाता बनाउनुहोस्" },
  alreadyHaveAccount: { en: "Already have an account?", ne: "पहिले नै खाता छ?" },
  noAccount: { en: "Don't have an account?", ne: "खाता छैन?" },
  loginTitle: { en: "Welcome Back", ne: "फेरि स्वागत छ" },
  loginSub: { en: "Enter your phone number to continue.", ne: "जारी राख्न आफ्नो फोन नम्बर हाल्नुहोस्।" },

  // -- Candidate Dashboard --
  candidateDashTitle: { en: "Your Dashboard", ne: "तपाईंको ड्यासबोर्ड" },
  matchingJobs: { en: "Jobs Matching Your Skills", ne: "तपाईंको सीपसँग मिल्ने कामहरू" },
  browseAll: { en: "Browse All Jobs", ne: "सबै कामहरू हेर्नुहोस्" },
  experienceMapper: { en: "Experience Mapper", ne: "अनुभव म्यापर" },
  experienceMapperSub: {
    en: "Describe any unpaid or informal work and we'll find the skills it proves.",
    ne: "कुनै पनि अतलबी वा अनौपचारिक काम वर्णन गर्नुहोस् र हामी यसले प्रमाणित गर्ने सीपहरू खोज्नेछौं।",
  },
  yourSkills: { en: "Your Skills", ne: "तपाईंको सीपहरू" },
  noSkillsYet: { en: "No skills mapped yet — try the Experience Mapper!", ne: "अहिलेसम्म सीप म्याप गरिएको छैन — अनुभव म्यापर प्रयोग गर्नुहोस्!" },
  subscriptions: { en: "Job Alerts", ne: "काम सूचना" },
  subscriptionsSub: { en: "Get notified when jobs matching your interests are posted.", ne: "तपाईंको चासोसँग मिल्ने कामहरू पोस्ट हुँदा सूचना पाउनुहोस्।" },
  noSubscriptions: { en: "No alerts set up yet.", ne: "अहिलेसम्म कुनै सूचना सेटअप गरिएको छैन।" },

  // -- Notifications --
  notifications: { en: "Notifications", ne: "सूचनाहरू" },
  noNotifications: { en: "No notifications", ne: "कुनै सूचना छैन" },
  markAllRead: { en: "Mark all read", ne: "सबै पढिएको चिन्ह लगाउनुहोस्" },
  newJobAlert: { en: "New job alert", ne: "नयाँ काम सूचना" },

  // -- Experience Mapper --
  experienceMapperTitle: { en: "Experience Mapper", ne: "अनुभव म्यापर" },
  experienceMapperDesc: {
    en: "Describe what you did during any break — caregiving, farming, a family business, volunteering — and we'll map it to workplace skills employers are looking for.",
    ne: "ब्रेकको समयमा तपाईंले के गर्नुभयो — हेरचाह, खेती, पारिवारिक व्यवसाय, स्वयंसेवा — वर्णन गर्नुहोस् र हामी यसलाई रोजगारदाताहरूले खोजिरहेका कार्यस्थल सीपहरूमा म्याप गर्नेछौं।",
  },
  describeExperience: { en: "Describe your experience…", ne: "आफ्नो अनुभव वर्णन गर्नुहोस्…" },
  mapSkills: { en: "Map My Skills", ne: "मेरो सीपहरू म्याप गर्नुहोस्" },
  mapping: { en: "Mapping your skills…", ne: "तपाईंको सीपहरू म्याप गर्दैछ…" },
  skillsFound: { en: "Skills Found", ne: "सीपहरू भेटियो" },
  evidence: { en: "Evidence", ne: "प्रमाण" },
  viewJobs: { en: "View Matching Jobs", ne: "मिल्ने कामहरू हेर्नुहोस्" },
  saveToProfile: { en: "Save to Profile", ne: "प्रोफाइलमा सुरक्षित गर्नुहोस्" },

  // -- Jobs --
  jobs: { en: "Jobs", ne: "कामहरू" },
  searchJobs: { en: "Search jobs…", ne: "कामहरू खोज्नुहोस्…" },
  allCategories: { en: "All Categories", ne: "सबै श्रेणीहरू" },
  noJobs: { en: "No jobs found.", ne: "कुनै काम भेटिएन।" },
  apply: { en: "Start Task", ne: "कार्य सुरु गर्नुहोस्" },
  minuteTask: { en: "$min-minute work-sample task", ne: "$min-मिनेट कार्य-नमूना कार्य" },
  postedBy: { en: "Posted by", ne: "पोस्ट गर्ने" },
  location: { en: "Location", ne: "स्थान" },
  aiScored: { en: "AI-Scored", ne: "AI-स्कोर" },
  verified: { en: "Verified Employer", ne: "प्रमाणित रोजगारदाता" },
  subscribeTo: { en: "Get alerts for jobs like this", ne: "यस्तै कामहरूको लागि सूचना पाउनुहोस्" },
  subscribed: { en: "✓ Subscribed", ne: "✓ सदस्यता लिइयो" },

  // -- Categories --
  catRetail: { en: "Retail / Shop", ne: "पसल / रिटेल" },
  catAdmin: { en: "Office / Admin", ne: "कार्यालय / प्रशासन" },
  catOffice: { en: "Data / Clerical", ne: "डेटा / क्लेरिकल" },
  catHospitality: { en: "Hotel / Restaurant", ne: "होटल / रेस्टुरेन्ट" },
  catTeaching: { en: "Teaching / Tutoring", ne: "शिक्षण / ट्युसन" },
  catDriving: { en: "Driving / Delivery", ne: "ड्राइभिङ / डेलिभरी" },
  catConstruction: { en: "Construction / Labour", ne: "निर्माण / श्रम" },
  catItSupport: { en: "IT / Tech Support", ne: "आईटी / टेक सपोर्ट" },

  // -- Task Flow --
  taskIntro: {
    en: "This is an anonymous work-sample task. Your identity is hidden from the employer until you choose to share it.",
    ne: "यो एक गुमनाम कार्य-नमूना कार्य हो। तपाईंले साझा गर्न नछान्दासम्म तपाईंको पहिचान रोजगारदाताबाट लुकाइएको छ।",
  },
  startTask: { en: "Start Task", ne: "कार्य सुरु गर्नुहोस्" },
  timeLeft: { en: "Time left", ne: "बाँकी समय" },
  scenario: { en: "Scenario", ne: "परिदृश्य" },
  typeHere: { en: "Type your answer here…", ne: "यहाँ आफ्नो उत्तर टाइप गर्नुहोस्…" },
  voiceMode: { en: "Voice", ne: "आवाज" },
  textMode: { en: "Text", ne: "पाठ" },
  submitAll: { en: "Submit All Answers", ne: "सबै उत्तर पेश गर्नुहोस्" },
  submitting: { en: "Scoring your answers…", ne: "तपाईंको उत्तरहरू स्कोर गर्दैछ…" },
  taskDone: { en: "Task Submitted!", ne: "कार्य पेश भयो!" },
  taskDoneMsg: {
    en: "Your answers have been scored and submitted anonymously. The employer will see your rank but not your identity.",
    ne: "तपाईंको उत्तरहरू स्कोर गरी गुमनाम रूपमा पेश गरिएको छ। रोजगारदाताले तपाईंको रैंक देख्नेछ तर पहिचान होइन।",
  },
  viewOutcome: { en: "View Your Outcome", ne: "आफ्नो नतिजा हेर्नुहोस्" },
  sharedDevice: { en: "Shared phone?", ne: "साझा फोन?" },
  sharedDeviceHint: {
    en: "Turn this on if others use this device — your answers won't be saved locally.",
    ne: "यो अन्यले पनि प्रयोग गर्ने उपकरण हो भने यो खोल्नुहोस् — तपाईंको उत्तरहरू स्थानीय रूपमा सुरक्षित हुँदैनन्।",
  },

  // -- Candidate details in task flow --
  almostDone: { en: "Almost done — tell us a bit about yourself", ne: "लगभग सकियो — आफ्नो बारेमा थोरै बताउनुहोस्" },
  detailsHint: {
    en: "This is used only for fairness statistics and to let you reveal your identity later if shortlisted. The employer sees none of it during scoring.",
    ne: "यो केवल निष्पक्षता तथ्याङ्कको लागि र छनौट भएमा पछि आफ्नो पहिचान देखाउन प्रयोग गरिन्छ। स्कोरिङमा रोजगारदाताले यो देख्दैन।",
  },
  yourName: { en: "Your Name", ne: "तपाईंको नाम" },
  yourPhone: { en: "Your Phone", ne: "तपाईंको फोन" },
  namePlaceholder: { en: "e.g. Sita Gurung", ne: "जस्तै: सीता गुरुङ" },
  phonePlaceholder: { en: "e.g. 9801234567", ne: "जस्तै: ९८०१२३४५६७" },

  // -- Outcome --
  outcomeTitle: { en: "Your Outcome", ne: "तपाईंको नतिजा" },
  totalScore: { en: "Total Score", ne: "कुल स्कोर" },
  scoredBy: { en: "Scored by", ne: "स्कोर गर्ने" },
  rank: { en: "Rank", ne: "रैंक" },
  outOf: { en: "out of", ne: "मध्ये" },
  shortlisted: { en: "Shortlisted ✓", ne: "छनौट भयो ✓" },
  notShortlisted: { en: "Not shortlisted this time", ne: "यस पटक छनौट भएन" },
  consentLabel: {
    en: "Share my name and phone with the employer",
    ne: "मेरो नाम र फोन रोजगारदातालाई दिनुहोस्",
  },
  consentHint: {
    en: "Until you share, the employer sees only your anonymous score and rank.",
    ne: "तपाईंले साझा नगर्दासम्म रोजगारदाताले तपाईंको गुमनाम स्कोर र रैंक मात्र देख्छ।",
  },
  consentGranted: { en: "Identity shared with employer", ne: "पहिचान रोजगारदातालाई दिइएको छ" },

  // -- Employer --
  postJob: { en: "Post a Job", ne: "काम पोस्ट गर्नुहोस्" },
  jobTitle: { en: "Job Title", ne: "कामको शीर्षक" },
  companyName: { en: "Company / Employer Name", ne: "कम्पनी / रोजगारदाताको नाम" },
  category: { en: "Category", ne: "श्रेणी" },
  locationPlaceholder: { en: "e.g. Kathmandu, Pokhara", ne: "जस्तै: काठमाडौं, पोखरा" },
  tagsHint: { en: "Skills to look for (comma-separated)", ne: "खोज्ने सीपहरू (अल्पविरामले छुट्याउनुहोस्)" },
  taskPreview: { en: "Task Preview", ne: "कार्य पूर्वावलोकन" },
  postJobBtn: { en: "Post Job", ne: "काम पोस्ट गर्नुहोस्" },
  posting: { en: "Posting…", ne: "पोस्ट गर्दैछ…" },
  jobPosted: { en: "Job Posted!", ne: "काम पोस्ट भयो!" },
  copyLink: { en: "Copy Link", ne: "लिंक कपी गर्नुहोस्" },
  copied: { en: "Copied!", ne: "कपी भयो!" },
  customQuestions: { en: "Custom Questions (optional)", ne: "कस्टम प्रश्नहरू (ऐच्छिक)" },
  customQuestionsHint: {
    en: "Add your own questions instead of auto-generated ones. Leave empty for AI-generated questions.",
    ne: "स्वत: उत्पन्न प्रश्नहरूको सट्टा आफ्ना प्रश्नहरू थप्नुहोस्। AI-उत्पन्न प्रश्नहरूको लागि खाली छोड्नुहोस्।",
  },
  addQuestion: { en: "+ Add Question", ne: "+ प्रश्न थप्नुहोस्" },
  removeQuestion: { en: "Remove", ne: "हटाउनुहोस्" },
  questionPlaceholder: { en: "Type your question…", ne: "आफ्नो प्रश्न टाइप गर्नुहोस्…" },
  durationMin: { en: "Task Duration (minutes)", ne: "कार्य अवधि (मिनेट)" },
  aiScoringToggle: { en: "AI Scoring", ne: "AI स्कोरिङ" },
  aiScoringOn: { en: "AI will score answers automatically", ne: "AI ले स्वचालित रूपमा उत्तरहरू स्कोर गर्नेछ" },
  aiScoringOff: { en: "Rule-based scoring (no AI)", ne: "नियम-आधारित स्कोरिङ (AI बिना)" },

  // -- Employer Dashboard --
  yourJobs: { en: "Your Jobs", ne: "तपाईंको कामहरू" },
  applicants: { en: "applicants", ne: "आवेदकहरू" },
  viewResults: { en: "View Results", ne: "नतिजा हेर्नुहोस्" },
  biasDashboard: { en: "Fairness Dashboard", ne: "निष्पक्षता ड्यासबोर्ड" },

  // -- Results / Ranking --
  resultsTitle: { en: "Anonymous Rankings", ne: "गुमनाम रैंकिंग" },
  noApplicants: { en: "No applicants yet.", ne: "अहिलेसम्म कुनै आवेदक छैन।" },
  criterionBreakdown: { en: "Score Breakdown", ne: "स्कोर विश्लेषण" },
  identityRevealed: { en: "Identity Revealed", ne: "पहिचान देखाइएको" },
  waitingConsent: { en: "Waiting for consent", ne: "सहमतिको पर्खाइमा" },

  // -- Bias Dashboard --
  biasTitle: { en: "Fairness Dashboard", ne: "निष्पक्षता ड्यासबोर्ड" },
  biasSub: {
    en: "Compares merit-based shortlisting to estimated résumé-based outcomes.",
    ne: "योग्यता-आधारित छनौटलाई अनुमानित बायोडाटा-आधारित नतिजासँग तुलना गर्दछ।",
  },
  meritBased: { en: "Merit-Based (MeritMatch)", ne: "योग्यता-आधारित (मेरिटम्याच)" },
  resumeBased: { en: "Résumé-Based (Estimated)", ne: "बायोडाटा-आधारित (अनुमानित)" },
  women: { en: "Women", ne: "महिला" },
  ruralCandidates: { en: "Rural Candidates", ne: "ग्रामीण उम्मेदवारहरू" },
  poolShare: { en: "In applicant pool", ne: "आवेदक पूलमा" },
  shortlistShare: { en: "In shortlist", ne: "छनौट सूचीमा" },

  // -- Admin --
  adminVerify: { en: "Employer Verification", ne: "रोजगारदाता प्रमाणीकरण" },
  verify: { en: "Verify", ne: "प्रमाणित गर्नुहोस्" },
  revoke: { en: "Revoke", ne: "रद्द गर्नुहोस्" },

  // -- Voice --
  voiceUnsupported: {
    en: "Voice input is not supported in this browser. Please type your answer.",
    ne: "यो ब्राउजरमा आवाज इनपुट समर्थित छैन। कृपया आफ्नो उत्तर टाइप गर्नुहोस्।",
  },
  recording: { en: "Listening…", ne: "सुन्दैछ…" },
  tapToSpeak: { en: "Tap to speak", ne: "बोल्न ट्याप गर्नुहोस्" },

  // -- Misc --
  howItWorks: { en: "How It Works", ne: "यसले कसरी काम गर्छ" },
  step1Title: { en: "Sign Up", ne: "साइन अप" },
  step1Desc: { en: "Create your profile with basic info — no résumé needed.", ne: "आधारभूत जानकारीसहित प्रोफाइल बनाउनुहोस् — बायोडाटा चाहिँदैन।" },
  step2Title: { en: "Find Jobs", ne: "काम खोज्नुहोस्" },
  step2Desc: { en: "Browse jobs matched to your skills, or get notified automatically.", ne: "आफ्नो सीपसँग मिल्ने कामहरू खोज्नुहोस्, वा स्वचालित सूचना पाउनुहोस्।" },
  step3Title: { en: "Complete a Task", ne: "कार्य पूरा गर्नुहोस्" },
  step3Desc: { en: "Do a short, anonymous work-sample — your identity stays hidden.", ne: "छोटो, गुमनाम कार्य-नमूना गर्नुहोस् — तपाईंको पहिचान लुकेको रहन्छ।" },
  step4Title: { en: "Get Ranked", ne: "रैंक पाउनुहोस्" },
  step4Desc: { en: "AI scores your work fairly. Share your identity only if shortlisted.", ne: "AI ले तपाईंको कामलाई निष्पक्ष रूपमा स्कोर गर्छ। छनौट भएमा मात्र पहिचान साझा गर्नुहोस्।" },
  forEmployers: { en: "For Employers", ne: "रोजगारदाताहरूका लागि" },
  forEmployersDesc: {
    en: "Post a job with work-sample tasks and find the best candidates based on skill, not connections.",
    ne: "कार्य-नमूना कार्यहरूसहित काम पोस्ट गर्नुहोस् र सिफारिस होइन, सीपको आधारमा उत्तम उम्मेदवारहरू खोज्नुहोस्।",
  },
  learnMore: { en: "Learn More", ne: "थप जान्नुहोस्" },
  fairHiring: { en: "Fair Hiring", ne: "निष्पक्ष भर्ना" },
  fairHiringDesc: {
    en: "Anonymous scoring removes bias from gender, region, caste and network.",
    ne: "गुमनाम स्कोरिङले लिङ्ग, क्षेत्र, जात र सिफारिसबाट पक्षपात हटाउँछ।",
  },
  skillFirst: { en: "Skills First", ne: "सीप पहिले" },
  skillFirstDesc: {
    en: "Candidates show what they can do with real tasks, not paper credentials.",
    ne: "उम्मेदवारहरूले कागजी प्रमाणपत्र होइन, वास्तविक कार्यहरूमार्फत के गर्न सक्छन् देखाउँछन्।",
  },
  accessibility: { en: "Accessible", ne: "सुलभ" },
  accessibilityDesc: {
    en: "Works on any phone. Voice input and Nepali support built in.",
    ne: "कुनै पनि फोनमा काम गर्छ। आवाज इनपुट र नेपाली समर्थन निर्मित।",
  },
};

export function t(key: string, lang: Lang, vars?: Record<string, string>): string {
  let s = strings[key]?.[lang] ?? strings[key]?.en ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(`$${k}`, v);
    }
  }
  return s;
}

const NE_DIGITS = "०१२३४५६७८९";
export function localizeDigits(n: number | string, lang: Lang): string {
  const s = String(n);
  if (lang !== "ne") return s;
  return s.replace(/\d/g, (d) => NE_DIGITS[+d]);
}
