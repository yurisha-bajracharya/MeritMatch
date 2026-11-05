import { getPublicMcq } from "./mcq-bank";
import type { Category, Evidence, TaskTemplate } from "./types";

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
      description: "Acknowledges the customer's frustration, stays polite, and does not blame or argue.",
      max: 10,
      tags: ["customer-service", "communication"],
      signals: ["sorry", "understand", "apologi", "please", "listen", "calm", "माफ", "बुझ", "शान्त", "कृपया", "सुन"],
    },
    {
      id: "problem_solving",
      label: { en: "Problem solving", ne: "समस्या समाधान" },
      description: "Offers a workable next step: checks purchase records, offers exchange or credit, escalates to a manager when needed, handles several people in a sensible order.",
      max: 10,
      tags: ["problem-solving", "time-management"],
      signals: ["manager", "exchange", "check", "record", "first", "then", "wait", "minute", "मेनेजर", "साटा", "जाँच", "पहिले", "त्यसपछि", "कुर"],
    },
    {
      id: "numeracy",
      label: { en: "Accuracy with numbers", ne: "गणनामा शुद्धता" },
      description: "Correct total of Rs 3,000 (1,250 x 0.8 = 1,000 per jacket, x 3). Working shown and explained clearly.",
      max: 10,
      tags: ["numeracy", "accuracy"],
      signals: ["3000", "3,000", "1000", "1,000", "३०००", "३,०००", "१०००", "१,०००", "discount", "छुट"],
    },
    {
      id: "clarity",
      label: { en: "Clear communication", ne: "स्पष्ट सञ्चार" },
      description: "Answers are easy to follow, specific, and written the way you would speak to a customer.",
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
      description: "Spots the duplicate entry, the incomplete phone number, the missing location and the inconsistent name formatting.",
      max: 10,
      tags: ["accuracy", "data-entry"],
      signals: ["duplicate", "twice", "missing", "blank", "digit", "incomplete", "capital", "verify", "दोहोर", "खाली", "अधुरो", "नम्बर", "जाँच", "पुष्टि"],
    },
    {
      id: "planning",
      label: { en: "Planning under pressure", ne: "दबाबमा योजना" },
      description: "Does urgent forms first, sets a realistic pace, flags to the manager if the deadline is at risk.",
      max: 10,
      tags: ["time-management", "organization"],
      signals: ["urgent", "first", "pace", "per hour", "tell", "inform", "priority", "जरुरी", "पहिले", "प्राथमिकता", "जानकारी", "घण्टा"],
    },
    {
      id: "organization",
      label: { en: "Organisation", ne: "व्यवस्थापन" },
      description: "A consistent naming scheme, a clear folder structure, and a backup habit.",
      max: 10,
      tags: ["organization", "digital-literacy"],
      signals: ["folder", "date", "name", "version", "backup", "consistent", "फोल्डर", "मिति", "नाम", "ब्याकअप"],
    },
    {
      id: "clarity",
      label: { en: "Clear communication", ne: "स्पष्ट सञ्चार" },
      description: "Answers are specific, structured and easy for a manager to act on.",
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
      description: "Polite, respectful, states the shortfall and the deadline without blame.",
      max: 10,
      tags: ["communication", "professionalism"],
      signals: ["dear", "thank", "regards", "kindly", "respect", "please", "धन्यवाद", "कृपया", "आदरणीय", "निवेदन"],
    },
    {
      id: "judgement",
      label: { en: "Judgement", ne: "विवेक" },
      description: "Clarifies priorities with the manager rather than choosing silently.",
      max: 10,
      tags: ["problem-solving", "teamwork"],
      signals: ["clarify", "ask", "manager", "both", "inform", "priority", "सोध", "मेनेजर", "प्राथमिकता", "जानकारी"],
    },
    {
      id: "organization",
      label: { en: "Organisation", ne: "व्यवस्थापन" },
      description: "Meeting plan covers date/time, room, agenda, invites, reminders, materials, and notes afterwards.",
      max: 10,
      tags: ["organization", "time-management"],
      signals: ["agenda", "room", "invite", "reminder", "notes", "calendar", "time", "एजेन्डा", "कोठा", "निमन्त्रणा", "सम्झना", "समय"],
    },
    {
      id: "clarity",
      label: { en: "Clear communication", ne: "स्पष्ट सञ्चार" },
      description: "Specific quantities, dates and next steps; no vague phrasing.",
      max: 10,
      tags: ["communication"],
      signals: [],
    },
  ],
};

const hospitality: TaskTemplate = {
  category: "hospitality",
  name: { en: "Hotel / restaurant", ne: "होटल / रेस्टुरेन्ट" },
  durationMin: 15,
  scenarios: [
    {
      id: "h1",
      prompt: {
        en: "A guest at a restaurant complains their food is cold after waiting 40 minutes. They want to leave without paying. What do you do?",
        ne: "एक पाहुनाले ४० मिनेट पर्खेपछि खाना चिसो आएको गुनासो गर्छन्। उनी पैसा नतिरी जान चाहन्छन्। तपाईं के गर्नुहुन्छ?",
      },
    },
    {
      id: "h2",
      prompt: {
        en: "You are working the morning shift alone. A delivery arrives, the phone rings, and a customer walks in — all at the same time. How do you handle it?",
        ne: "तपाईं बिहानको शिफ्टमा एक्लै हुनुहुन्छ। डेलिभरी आउँछ, फोन बज्छ, र एक ग्राहक भित्र आउँछन् — सबै एकैपटक। कसरी सम्हाल्नुहुन्छ?",
      },
    },
    {
      id: "h3",
      prompt: {
        en: "A group of 12 wants to book dinner for tomorrow, but you only have tables for 8. What options do you offer them?",
        ne: "१२ जनाको समूहले भोलिको खानाको लागि बुकिङ गर्न चाहन्छन्, तर तपाईंसँग ८ जनाको मात्र टेबल छ। तपाईं उनीहरूलाई कुन विकल्प दिनुहुन्छ?",
      },
    },
  ],
  rubric: [
    {
      id: "service",
      label: { en: "Guest handling", ne: "पाहुना सम्हालाइ" },
      description: "Empathetic response, doesn't argue, offers a fix like remaking food or a discount.",
      max: 10,
      tags: ["customer-service", "communication"],
      signals: ["sorry", "apologize", "remake", "discount", "free", "माफ", "फेरि", "छुट"],
    },
    {
      id: "multitask",
      label: { en: "Multitasking", ne: "बहु-कार्य" },
      description: "Prioritises the people present, manages the delivery and phone reasonably.",
      max: 10,
      tags: ["time-management", "problem-solving"],
      signals: ["first", "customer", "wait", "phone", "delivery", "priority", "पहिले", "ग्राहक"],
    },
    {
      id: "flexibility",
      label: { en: "Creative solutions", ne: "रचनात्मक समाधान" },
      description: "Offers options like combining tables, staggered seating, or a different time slot.",
      max: 10,
      tags: ["problem-solving", "organization"],
      signals: ["combine", "two tables", "shift", "time", "arrange", "जोड", "मिला", "समय"],
    },
    {
      id: "clarity",
      label: { en: "Clear communication", ne: "स्पष्ट सञ्चार" },
      description: "Answers are direct and practical.",
      max: 10,
      tags: ["communication"],
      signals: [],
    },
  ],
};

const teaching: TaskTemplate = {
  category: "teaching",
  name: { en: "Teaching / tutoring", ne: "शिक्षण / ट्युसन" },
  durationMin: 15,
  scenarios: [
    {
      id: "t1",
      prompt: {
        en: "A student in your class doesn't understand fractions. They have failed the same topic twice. How do you help them learn it this time?",
        ne: "तपाईंको कक्षाको एक विद्यार्थीले भिन्न (fractions) बुझ्दैनन्। उनी यही विषयमा दुईपटक फेल भइसकेका छन्। यसपटक कसरी सिकाउनुहुन्छ?",
      },
    },
    {
      id: "t2",
      prompt: {
        en: "Two students are arguing in class and refusing to sit next to each other. You have 30 other students waiting. What do you do?",
        ne: "दुई विद्यार्थी कक्षामा झगडा गर्दैछन् र एकअर्काको छेउमा बस्न मान्दैनन्। अरू ३० विद्यार्थी पर्खिरहेका छन्। तपाईं के गर्नुहुन्छ?",
      },
    },
    {
      id: "t3",
      prompt: {
        en: "You need to teach a 45-minute class on road safety to grade 5 students. Write a short plan: what activities, what materials, how you check they learned it.",
        ne: "कक्षा ५ का विद्यार्थीलाई सडक सुरक्षाबारे ४५ मिनेटको कक्षा लिनुपर्छ। छोटो योजना लेख्नुहोस्: कुन गतिविधि, कुन सामग्री, र सिकेको कसरी जाँच्नुहुन्छ।",
      },
    },
  ],
  rubric: [
    {
      id: "pedagogy",
      label: { en: "Teaching approach", ne: "शिक्षण पद्धति" },
      description: "Uses concrete examples, visual aids, or hands-on activities rather than just repeating the explanation.",
      max: 10,
      tags: ["teaching", "communication"],
      signals: ["example", "show", "draw", "hands-on", "practice", "visual", "उदाहरण", "देखाउ", "अभ्यास"],
    },
    {
      id: "management",
      label: { en: "Classroom management", ne: "कक्षा व्यवस्थापन" },
      description: "Handles the conflict calmly, doesn't ignore or overreact, gets the class back on track quickly.",
      max: 10,
      tags: ["problem-solving", "leadership"],
      signals: ["separate", "talk", "calm", "rule", "after class", "छुट्ट", "कुरा", "शान्त", "नियम"],
    },
    {
      id: "lesson_plan",
      label: { en: "Lesson planning", ne: "पाठ योजना" },
      description: "Clear structure with activities, timing, materials and a way to check understanding.",
      max: 10,
      tags: ["organization", "teaching"],
      signals: ["plan", "activity", "minute", "material", "quiz", "question", "योजना", "गतिविधि", "मिनेट", "सामग्री"],
    },
    {
      id: "clarity",
      label: { en: "Clear communication", ne: "स्पष्ट सञ्चार" },
      description: "Answers are clear and age-appropriate.",
      max: 10,
      tags: ["communication"],
      signals: [],
    },
  ],
};

const driving: TaskTemplate = {
  category: "driving",
  name: { en: "Driving / delivery", ne: "सवारी / डेलिभरी" },
  durationMin: 12,
  scenarios: [
    {
      id: "d1",
      prompt: {
        en: "You are delivering goods and hit heavy traffic. You will be 30 minutes late to the next stop. What do you do?",
        ne: "तपाईं सामान पुर्याउँदै हुनुहुन्छ र ठूलो ट्राफिकमा फस्नुभयो। अर्को ठाउँमा ३० मिनेट ढिला हुनुहुनेछ। तपाईं के गर्नुहुन्छ?",
      },
    },
    {
      id: "d2",
      prompt: {
        en: "You notice the brakes feel soft while driving a loaded vehicle. What steps do you take?",
        ne: "सामान लोड गरिएको गाडी चलाउँदा ब्रेक नरम महसुस हुन्छ। तपाईंले कुन कदम चाल्नुहुन्छ?",
      },
    },
    {
      id: "d3",
      prompt: {
        en: "At a delivery point, the customer says 2 items are missing from the order. How do you handle it?",
        ne: "डेलिभरी स्थानमा ग्राहकले अर्डरबाट २ वटा सामान छुटेको भन्छन्। तपाईं कसरी सम्हाल्नुहुन्छ?",
      },
    },
  ],
  rubric: [
    {
      id: "responsibility",
      label: { en: "Responsibility", ne: "जिम्मेवारी" },
      description: "Informs the customer/office about the delay proactively, takes safe action with brakes.",
      max: 10,
      tags: ["professionalism", "communication"],
      signals: ["call", "inform", "tell", "safe", "stop", "फोन", "जानकारी", "सुरक्षित", "रोक"],
    },
    {
      id: "safety",
      label: { en: "Safety awareness", ne: "सुरक्षा चेतना" },
      description: "Stops safely, doesn't continue driving with faulty brakes, checks the vehicle.",
      max: 10,
      tags: ["problem-solving", "accuracy"],
      signals: ["stop", "pull over", "check", "mechanic", "slow", "रोक", "जाँच", "मेकानिक", "बिस्तारै"],
    },
    {
      id: "problem_solving",
      label: { en: "Problem solving", ne: "समस्या समाधान" },
      description: "Checks delivery list, counts items, contacts office to resolve missing items.",
      max: 10,
      tags: ["problem-solving", "customer-service"],
      signals: ["list", "count", "check", "office", "missing", "verify", "सूची", "गिन", "जाँच", "छुट"],
    },
    {
      id: "clarity",
      label: { en: "Clear communication", ne: "स्पष्ट सञ्चार" },
      description: "Direct, practical answers.",
      max: 10,
      tags: ["communication"],
      signals: [],
    },
  ],
};

const construction: TaskTemplate = {
  category: "construction",
  name: { en: "Construction / labour", ne: "निर्माण / श्रमिक" },
  durationMin: 12,
  scenarios: [
    {
      id: "c1",
      prompt: {
        en: "You arrive at a construction site and notice a coworker is not wearing a helmet. What do you do?",
        ne: "तपाईं निर्माण स्थलमा पुग्नुहुन्छ र एक सहकर्मीले हेल्मेट नलगाएको देख्नुहुन्छ। तपाईं के गर्नुहुन्छ?",
      },
    },
    {
      id: "c2",
      prompt: {
        en: "The cement delivery is late and your team of 5 has nothing to do for 2 hours. How do you use the time?",
        ne: "सिमेन्ट डेलिभरी ढिलो भएको छ र तपाईंको ५ जनाको टोलीसँग २ घण्टा केही काम छैन। तपाईं समय कसरी प्रयोग गर्नुहुन्छ?",
      },
    },
    {
      id: "c3",
      prompt: {
        en: "You are asked to measure and cut 8 equal pieces from a 12-foot wooden plank. How long is each piece? What do you do to make sure they are all equal?",
        ne: "तपाईंलाई १२ फिटको काठको फल्याकबाट ८ बराबर टुक्रा काट्न भनिएको छ। प्रत्येक टुक्रा कति लामो हुन्छ? सबै बराबर छन् भनी कसरी सुनिश्चित गर्नुहुन्छ?",
      },
    },
  ],
  rubric: [
    {
      id: "safety",
      label: { en: "Safety", ne: "सुरक्षा" },
      description: "Speaks up about the missing helmet politely but firmly.",
      max: 10,
      tags: ["professionalism", "teamwork"],
      signals: ["helmet", "safety", "tell", "rule", "supervisor", "हेल्मेट", "सुरक्षा", "भन", "नियम"],
    },
    {
      id: "initiative",
      label: { en: "Initiative", ne: "पहल" },
      description: "Uses downtime productively: cleaning, organising tools, preparing the site.",
      max: 10,
      tags: ["organization", "time-management"],
      signals: ["clean", "organize", "prepare", "tool", "tidy", "सफा", "मिला", "तयार", "औजार"],
    },
    {
      id: "numeracy",
      label: { en: "Measurement", ne: "नाप" },
      description: "Correct: 12÷8 = 1.5 feet (18 inches) each. Shows a method to verify (marking, measuring twice).",
      max: 10,
      tags: ["numeracy", "accuracy"],
      signals: ["1.5", "18 inch", "measure", "mark", "twice", "१.५", "१८ इन्च", "नाप", "चिन्ह"],
    },
    {
      id: "clarity",
      label: { en: "Clear communication", ne: "स्पष्ट सञ्चार" },
      description: "Practical, clear answers.",
      max: 10,
      tags: ["communication"],
      signals: [],
    },
  ],
};

const itSupport: TaskTemplate = {
  category: "it-support",
  name: { en: "IT / tech support", ne: "आईटी / प्राविधिक सहायता" },
  durationMin: 15,
  scenarios: [
    {
      id: "i1",
      prompt: {
        en: "An office worker says their computer is 'not working'. When you arrive, the screen is black. Walk through what you check, step by step.",
        ne: "एक कार्यालय कर्मचारी भन्छन् उनीहरूको कम्प्युटर 'चलेन'। तपाईं पुग्दा स्क्रिन कालो छ। तपाईं चरणबद्ध रूपमा के के जाँच गर्नुहुन्छ?",
      },
    },
    {
      id: "i2",
      prompt: {
        en: "Everyone in the office says the internet is slow. Your manager asks you to figure out why and fix it if you can. What do you do?",
        ne: "कार्यालयका सबैले इन्टरनेट ढिलो छ भन्छन्। मेनेजरले किन हो पत्ता लगाउन र सकेसम्म ठीक गर्न भन्नुहुन्छ। तपाईं के गर्नुहुन्छ?",
      },
    },
    {
      id: "i3",
      prompt: {
        en: "A colleague accidentally deleted an important file from the shared drive yesterday. They are panicking. What do you do?",
        ne: "एक सहकर्मीले हिजो साझा ड्राइभबाट एउटा महत्त्वपूर्ण फाइल गलतीले मेटाइदिए। उनी आत्तिएका छन्। तपाईं के गर्नुहुन्छ?",
      },
    },
  ],
  rubric: [
    {
      id: "troubleshooting",
      label: { en: "Troubleshooting", ne: "समस्या निवारण" },
      description: "Systematic approach: checks power, cables, monitor, restart. Doesn't skip basics.",
      max: 10,
      tags: ["problem-solving", "digital-literacy"],
      signals: ["power", "cable", "restart", "plug", "monitor", "check", "पावर", "केबल", "रिस्टार्ट", "जाँच"],
    },
    {
      id: "diagnosis",
      label: { en: "Network diagnosis", ne: "नेटवर्क निदान" },
      description: "Checks router, speed test, number of devices, asks if it started suddenly.",
      max: 10,
      tags: ["problem-solving", "digital-literacy"],
      signals: ["router", "speed", "test", "device", "restart router", "bandwidth", "राउटर", "स्पिड", "डिभाइस"],
    },
    {
      id: "data_recovery",
      label: { en: "Data recovery", ne: "डेटा रिकभरी" },
      description: "Checks recycle bin/trash first, then backups, stays calm and reassures the colleague.",
      max: 10,
      tags: ["digital-literacy", "communication"],
      signals: ["recycle", "trash", "backup", "recover", "restore", "calm", "रिसाइकल", "ब्याकअप", "रिकभर"],
    },
    {
      id: "clarity",
      label: { en: "Clear communication", ne: "स्पष्ट सञ्चार" },
      description: "Explains in a way a non-technical person can understand.",
      max: 10,
      tags: ["communication"],
      signals: [],
    },
  ],
};

const tailoring: TaskTemplate = {
  category: "tailoring",
  name: { en: "Tailoring / crafts", ne: "सिलाइ / हस्तकला" },
  durationMin: 15,
  scenarios: [
    {
      id: "s1",
      prompt: {
        en: "A customer brings a wedding blouse that is too tight across the shoulders and wants it altered by Friday. What do you check and ask first, and what steps do you follow?",
        ne: "एक ग्राहकले काँधमा साँघुरो भएको विवाहको चोली ल्याउँछिन् र शुक्रबारसम्म मिलाइदिन भन्छिन्। तपाईं पहिले के जाँच्नुहुन्छ र के सोध्नुहुन्छ, अनि कुन कुन चरण अपनाउनुहुन्छ?",
      },
    },
    {
      id: "s2",
      prompt: {
        en: "A customer says the sleeves you stitched are 2 cm too short. You measured exactly what they asked for. How do you handle the conversation and what do you do next?",
        ne: "एक ग्राहक भन्छन् तपाईंले सिलाएको बाहुला २ सेमि छोटो भयो। तपाईंले उनले भनेकै नाप लिनुभएको थियो। कुरा कसरी सम्हाल्नुहुन्छ र अब के गर्नुहुन्छ?",
      },
    },
    {
      id: "s3",
      prompt: {
        en: "A school wants 4 uniforms. Each needs 2.5 metres of cloth at Rs 180 per metre, and stitching costs Rs 450 per uniform. What is the total? Show your working and explain the price to the school.",
        ne: "एउटा विद्यालयलाई ४ वटा पोशाक चाहिन्छ। प्रत्येकलाई २.५ मिटर कपडा चाहिन्छ, प्रतिमिटर रु. १८०, र सिलाइ प्रतिपोशाक रु. ४५०। जम्मा कति हुन्छ? हिसाब देखाउनुहोस् र विद्यालयलाई मूल्य कसरी बुझाउनुहुन्छ?",
      },
    },
  ],
  rubric: [
    {
      id: "technique",
      label: { en: "Craft and technique", ne: "सिलाइको सीप" },
      description: "Measures before cutting, checks seam allowance and fit, explains a sensible method for the alteration, and names the right tools or stitches.",
      max: 10,
      tags: ["tailoring", "accuracy"],
      signals: ["measure", "seam", "allowance", "fit", "chalk", "pin", "stitch", "iron", "try on", "नाप", "सिलाइ", "फिटिङ", "टाँक", "इस्त्री"],
    },
    {
      id: "customer",
      label: { en: "Customer handling", ne: "ग्राहक सम्हालाइ" },
      description: "Listens, apologises where fair, agrees a fix and a date, and keeps the relationship.",
      max: 10,
      tags: ["customer-service", "communication"],
      signals: ["sorry", "understand", "apologi", "free", "fix", "date", "माफ", "बुझ", "मिलाइ", "मिति"],
    },
    {
      id: "numeracy",
      label: { en: "Costing and accuracy", ne: "लागत र शुद्धता" },
      description: "Correct total of Rs 3,600 (2.5 m x Rs 180 x 4 = Rs 1,800 cloth, plus 4 x Rs 450 = Rs 1,800 stitching). Working shown and explained.",
      max: 10,
      tags: ["numeracy", "accuracy"],
      signals: ["3600", "3,600", "1800", "1,800", "३६००", "३,६००", "१८००", "१,८००", "cloth", "कपडा"],
    },
    {
      id: "clarity",
      label: { en: "Clear communication", ne: "स्पष्ट सञ्चार" },
      description: "Answers are specific, in a sensible order, and easy to follow.",
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
  hospitality,
  teaching,
  driving,
  construction,
  "it-support": itSupport,
  tailoring,
};

export function getTemplate(category: Category): TaskTemplate {
  return TEMPLATES[category];
}

/**
 * What candidates may see: scenarios and the choice questions, but never the
 * rubric, scorer internals or the answer key.
 */
export function toPublicTemplate({
  category,
  name,
  durationMin,
  scenarios,
}: TaskTemplate) {
  return { category, name, durationMin, scenarios, mcq: getPublicMcq(category) };
}

/** Which proof-of-work an employer is offered by default for a trade. */
export const DEFAULT_EVIDENCE: Partial<Record<Category, Evidence>> = {
  tailoring: "photos",
  teaching: "video",
};

export type PublicTemplate = ReturnType<typeof toPublicTemplate>;

export function templateTags(category: Category): string[] {
  return [...new Set(TEMPLATES[category].rubric.flatMap((c) => c.tags))];
}
