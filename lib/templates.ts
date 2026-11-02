import type { Category, TaskTemplate } from "./types";

const retail: TaskTemplate = {
  category: "retail",
  name: { en: "Retail / customer-facing", ne: "खुद्रा / ग्राहक सेवा" },
  durationMin: 15,
  scenarios: [
    {
      id: "r1",
      prompt: {
        en: "A customer comes back angry. The shirt they bought yesterday shrank after one wash and they want a refund, but they have no receipt. What do you say and do?",
        ne: "एक ग्राहक रिसाएर फर्किन्छन्। हिजो किनेको सर्ट एकपटक धुँदा खुम्चियो र उनी पैसा फिर्ता चाहन्छन्, तर रसिद छैन। तपाईं के भन्नुहुन्छ र के गर्नुहुन्छ?",
      },
    },
    {
      id: "r2",
      prompt: {
        en: "You are on the phone confirming stock for one customer when two more customers reach the counter at the same time. How do you handle all three?",
        ne: "तपाईं एक ग्राहकको सामानको स्टक फोनमा पुष्टि गर्दै हुनुहुन्छ, त्यसैबेला दुई थप ग्राहक एकैपटक काउन्टरमा आइपुग्छन्। तीनै जनालाई कसरी सम्हाल्नुहुन्छ?",
      },
    },
    {
      id: "r3",
      prompt: {
        en: "A jacket costs Rs 1,250 and is 20% off. A customer buys 3. What is the total? Show how you worked it out and how you would explain the bill to the customer.",
        ne: "एउटा ज्याकेटको मूल्य रु. १,२५० हो र २०% छुट छ। ग्राहकले ३ वटा किन्छन्। जम्मा कति हुन्छ? कसरी निकाल्नुभयो र ग्राहकलाई बिल कसरी बुझाउनुहुन्छ?",
      },
    },
  ],
  rubric: [
    {
      id: "empathy",
      label: { en: "Customer empathy", ne: "ग्राहकप्रति संवेदनशीलता" },
      description:
        "Acknowledges the customer's frustration, stays polite, and does not blame or argue.",
      max: 10,
      tags: ["customer-service", "communication"],
      signals: [
        "sorry",
        "understand",
        "apologi",
        "please",
        "listen",
        "calm",
        "माफ",
        "बुझ",
        "शान्त",
        "कृपया",
        "सुन",
      ],
    },
    {
      id: "problem_solving",
      label: { en: "Problem solving", ne: "समस्या समाधान" },
      description:
        "Offers a workable next step: checks purchase records, offers exchange or credit, escalates to a manager when needed, handles several people in a sensible order.",
      max: 10,
      tags: ["problem-solving", "time-management"],
      signals: [
        "manager",
        "exchange",
        "check",
        "record",
        "first",
        "then",
        "wait",
        "minute",
        "मेनेजर",
        "साटा",
        "जाँच",
        "पहिले",
        "त्यसपछि",
        "कुर",
      ],
    },
    {
      id: "numeracy",
      label: { en: "Accuracy with numbers", ne: "गणनामा शुद्धता" },
      description:
        "Correct total of Rs 3,000 (1,250 x 0.8 = 1,000 per jacket, x 3). Working shown and explained clearly.",
      max: 10,
      tags: ["numeracy", "accuracy"],
      signals: [
        "3000",
        "3,000",
        "1000",
        "1,000",
        "३०००",
        "३,०००",
        "१०००",
        "१,०००",
        "discount",
        "छुट",
      ],
    },
    {
      id: "clarity",
      label: { en: "Clear communication", ne: "स्पष्ट सञ्चार" },
      description:
        "Answers are easy to follow, specific, and written the way you would speak to a customer.",
      max: 10,
      tags: ["communication"],
      signals: [],
    },
  ],
};

const admin: TaskTemplate = {
  category: "admin",
  name: { en: "Admin / data entry", ne: "प्रशासन / डेटा इन्ट्री" },
  durationMin: 15,
  scenarios: [
    {
      id: "a1",
      prompt: {
        en: "You receive this list to type into the register:\n1) Sita Sharma, 9841234567, Kathmandu\n2) ram bdr thapa, 98412345, Pokhara\n3) Sita Sharma, 9841234567, Kathmandu\n4) Hari KC, 9812345678, (blank)\nWhat problems do you notice and what do you do about each?",
        ne: "रजिस्टरमा टाइप गर्न तपाईंलाई यो सूची दिइन्छ:\n१) Sita Sharma, 9841234567, Kathmandu\n२) ram bdr thapa, 98412345, Pokhara\n३) Sita Sharma, 9841234567, Kathmandu\n४) Hari KC, 9812345678, (खाली)\nतपाईंले के के समस्या देख्नुभयो र प्रत्येकमा के गर्नुहुन्छ?",
      },
    },
    {
      id: "a2",
      prompt: {
        en: "You must enter 50 forms by 5pm. At 3pm you have finished 20, and your manager adds 10 urgent forms. How do you plan the next two hours?",
        ne: "तपाईंले साँझ ५ बजेसम्म ५० फारम इन्ट्री गर्नुपर्छ। ३ बजे २० वटा सकिएको छ, र मेनेजरले थप १० वटा जरुरी फारम थप्नुहुन्छ। अबको दुई घण्टा कसरी योजना बनाउनुहुन्छ?",
      },
    },
    {
      id: "a3",
      prompt: {
        en: "Explain how you would name and organise files on a shared computer so a coworker can find them next month.",
        ne: "साझा कम्प्युटरमा फाइलहरूको नाम कसरी राख्नुहुन्छ र कसरी मिलाउनुहुन्छ, जसले गर्दा अर्को महिना सहकर्मीले सजिलै भेट्टाउन सकून्?",
      },
    },
  ],
  rubric: [
    {
      id: "accuracy",
      label: { en: "Attention to detail", ne: "सूक्ष्म ध्यान" },
      description:
        "Spots the duplicate entry, the incomplete phone number, the missing location and the inconsistent name formatting, and says to verify rather than guess.",
      max: 10,
      tags: ["accuracy", "data-entry"],
      signals: [
        "duplicate",
        "twice",
        "missing",
        "blank",
        "digit",
        "incomplete",
        "capital",
        "verify",
        "दोहोर",
        "खाली",
        "अधुरो",
        "नम्बर",
        "जाँच",
        "पुष्टि",
      ],
    },
    {
      id: "planning",
      label: { en: "Planning under pressure", ne: "दबाबमा योजना" },
      description:
        "Does urgent forms first, sets a realistic pace (40 forms in 2 hours), flags to the manager if the deadline is at risk.",
      max: 10,
      tags: ["time-management", "organization"],
      signals: [
        "urgent",
        "first",
        "pace",
        "per hour",
        "tell",
        "inform",
        "priority",
        "जरुरी",
        "पहिले",
        "प्राथमिकता",
        "जानकारी",
        "घण्टा",
      ],
    },
    {
      id: "organization",
      label: { en: "Organisation", ne: "व्यवस्थापन" },
      description:
        "A consistent, predictable naming scheme (date, topic, version), a clear folder structure, and a backup habit.",
      max: 10,
      tags: ["organization", "digital-literacy"],
      signals: [
        "folder",
        "date",
        "name",
        "version",
        "backup",
        "consistent",
        "फोल्डर",
        "मिति",
        "नाम",
        "ब्याकअप",
      ],
    },
    {
      id: "clarity",
      label: { en: "Clear communication", ne: "स्पष्ट सञ्चार" },
      description:
        "Answers are specific, structured and easy for a manager to act on.",
      max: 10,
      tags: ["communication"],
      signals: [],
    },
  ],
};

const office: TaskTemplate = {
  category: "office",
  name: { en: "General office", ne: "सामान्य कार्यालय" },
  durationMin: 15,
  scenarios: [
    {
      id: "o1",
      prompt: {
        en: "A supplier delivered 20 boxes but you ordered 30, and you need all 30 by Friday. Write a short, polite message to the supplier.",
        ne: "आपूर्तिकर्ताले २० बक्स पुर्याए तर तपाईंले ३० बक्स अर्डर गर्नुभएको थियो, र शुक्रबारसम्म सबै ३० चाहिन्छ। आपूर्तिकर्तालाई छोटो, शिष्ट सन्देश लेख्नुहोस्।",
      },
    },
    {
      id: "o2",
      prompt: {
        en: "Your manager tells you to finish report A first. A senior coworker tells you to finish report B first. Both are due today. What do you do?",
        ne: "मेनेजरले रिपोर्ट A पहिले सक्न भन्नुभयो। एक वरिष्ठ सहकर्मीले रिपोर्ट B पहिले सक्न भन्नुभयो। दुवै आजै बुझाउनुपर्छ। तपाईं के गर्नुहुन्छ?",
      },
    },
    {
      id: "o3",
      prompt: {
        en: "You are asked to organise a 2-hour staff meeting for 8 people next week. List the steps you take and what you prepare.",
        ne: "तपाईंलाई अर्को हप्ता ८ जनाको २ घण्टे कर्मचारी बैठक आयोजना गर्न भनिएको छ। तपाईंले कुन कुन चरण अपनाउनुहुन्छ र के के तयारी गर्नुहुन्छ?",
      },
    },
  ],
  rubric: [
    {
      id: "professionalism",
      label: { en: "Professional tone", ne: "व्यावसायिक शैली" },
      description:
        "Polite, respectful, states the shortfall and the deadline without blame. Handles the manager/coworker conflict openly.",
      max: 10,
      tags: ["communication", "professionalism"],
      signals: [
        "dear",
        "thank",
        "regards",
        "kindly",
        "respect",
        "please",
        "धन्यवाद",
        "कृपया",
        "आदरणीय",
        "निवेदन",
      ],
    },
    {
      id: "judgement",
      label: { en: "Judgement", ne: "विवेक" },
      description:
        "Clarifies priorities with the manager rather than choosing silently, and keeps the senior coworker informed.",
      max: 10,
      tags: ["problem-solving", "teamwork"],
      signals: [
        "clarify",
        "ask",
        "manager",
        "both",
        "inform",
        "priority",
        "सोध",
        "मेनेजर",
        "प्राथमिकता",
        "जानकारी",
      ],
    },
    {
      id: "organization",
      label: { en: "Organisation", ne: "व्यवस्थापन" },
      description:
        "Meeting plan covers date/time check, room, agenda, invites and reminders, materials, and notes afterwards.",
      max: 10,
      tags: ["organization", "time-management"],
      signals: [
        "agenda",
        "room",
        "invite",
        "reminder",
        "notes",
        "calendar",
        "time",
        "एजेन्डा",
        "कोठा",
        "निमन्त्रणा",
        "सम्झना",
        "समय",
      ],
    },
    {
      id: "clarity",
      label: { en: "Clear communication", ne: "स्पष्ट सञ्चार" },
      description:
        "Specific quantities, dates and next steps; no vague phrasing.",
      max: 10,
      tags: ["communication"],
      signals: [],
    },
  ],
};

export const TEMPLATES: Record<Category, TaskTemplate> = {
  retail,
  admin,
  office,
};

export function getTemplate(category: Category): TaskTemplate {
  return TEMPLATES[category];
}

/** What candidates may see: no rubric or scorer internals. */
export function toPublicTemplate({
  category,
  name,
  durationMin,
  scenarios,
}: TaskTemplate) {
  return { category, name, durationMin, scenarios };
}

export type PublicTemplate = ReturnType<typeof toPublicTemplate>;

export function templateTags(category: Category): string[] {
  return [...new Set(TEMPLATES[category].rubric.flatMap((c) => c.tags))];
}
