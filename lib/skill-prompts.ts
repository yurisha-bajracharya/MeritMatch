import type { Bilingual } from "./types";

/**
 * The follow-up question asked for each skill after the Experience Mapper,
 * and what kind of photo helps. Plain words, both languages. Every hint
 * steers people away from photographing faces or other people.
 */
export const SKILL_PROMPTS: Record<string, { question: Bilingual; hint: Bilingual }> = {
  "customer-service": {
    question: {
      en: "You've served customers. Can you show a photo of your stall, shop counter or the products you sell?",
      ne: "तपाईंले ग्राहकलाई सेवा दिनुभएको छ। आफ्नो पसल, काउन्टर वा बेच्ने सामानको फोटो देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "The place or products, not the customers.", ne: "ठाउँ वा सामानको फोटो, ग्राहकको होइन।" },
  },
  communication: {
    question: {
      en: "Can you show something you wrote or made to share information, like a notice, a post or a price board?",
      ne: "जानकारी दिन लेखेको वा बनाएको कुनै चिज, जस्तै सूचना, पोस्ट वा मूल्य-सूची देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "A screenshot or photo is fine.", ne: "स्क्रिनसट वा फोटो भए हुन्छ।" },
  },
  numeracy: {
    question: {
      en: "You handled money or accounts. Can you show a page of your hisab book or a bill you made?",
      ne: "तपाईंले पैसा वा हिसाब सम्हाल्नुभयो। हिसाब कापीको एउटा पाना वा आफूले बनाएको बिल देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "Cover customers' names and phone numbers first.", ne: "पहिले ग्राहकका नाम र फोन नम्बर छोप्नुहोस्।" },
  },
  accuracy: {
    question: {
      en: "Can you show work where getting details right mattered, like measurements, a stock list or a form you filled?",
      ne: "सानो कुरा पनि मिलाउनुपर्ने काम, जस्तै नाप, सामानको सूची वा भरेको फारम देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "Hide other people's personal details.", ne: "अरूको व्यक्तिगत विवरण लुकाउनुहोस्।" },
  },
  "data-entry": {
    question: {
      en: "Can you show a spreadsheet, register or list you kept?",
      ne: "तपाईंले राखेको स्प्रेडसिट, रजिस्टर वा सूची देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "Cover names and numbers of other people.", ne: "अरूका नाम र नम्बर छोप्नुहोस्।" },
  },
  organization: {
    question: {
      en: "You organised things. Can you show a plan, a schedule, or a photo of an event or space you arranged?",
      ne: "तपाईंले काम मिलाउनुभयो। योजना, तालिका, वा आफूले मिलाएको कार्यक्रम वा ठाउँको फोटो देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "Photos of the setup work best.", ne: "तयारीको फोटो राम्रो हुन्छ।" },
  },
  "digital-literacy": {
    question: {
      en: "Can you show a screenshot of something you made on a phone or computer, like a social media page, a document or a design?",
      ne: "फोन वा कम्प्युटरमा बनाएको कुनै चिज, जस्तै सामाजिक सञ्जालको पेज, कागजात वा डिजाइनको स्क्रिनसट देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "Page insights (views, followers) are great proof.", ne: "पेजको इनसाइट (भ्यु, फलोअर) राम्रो प्रमाण हो।" },
  },
  "time-management": {
    question: {
      en: "Can you show a routine, plan or calendar you kept to get things done on time?",
      ne: "समयमै काम सक्न राखेको दिनचर्या, योजना वा क्यालेन्डर देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "A photo of a written plan is fine.", ne: "लेखेको योजनाको फोटो भए हुन्छ।" },
  },
  "problem-solving": {
    question: {
      en: "Can you show something you fixed or improved, before and after?",
      ne: "तपाईंले बनाएको वा सुधारेको कुनै चिज, अघि र पछि देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "Two photos, before and after, work well.", ne: "अघि र पछिका दुई फोटो राम्रो हुन्छ।" },
  },
  teamwork: {
    question: {
      en: "Can you show something your group did together, like a programme, a stall or a project?",
      ne: "तपाईंको समूहले सँगै गरेको कुनै काम, जस्तै कार्यक्रम, स्टल वा परियोजना देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "Show the work, avoid close-up faces.", ne: "काम देखाउनुहोस्, अनुहार नजिकबाट नखिच्नुहोस्।" },
  },
  leadership: {
    question: {
      en: "Can you show proof of a role you led, like a letter, certificate or a group's notice with your role?",
      ne: "तपाईंले नेतृत्व गरेको भूमिकाको प्रमाण, जस्तै पत्र, प्रमाणपत्र वा समूहको सूचना देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "Cover phone numbers and ID numbers.", ne: "फोन र परिचयपत्र नम्बर छोप्नुहोस्।" },
  },
  tailoring: {
    question: {
      en: "You sew or make crafts. Can you show photos of clothes or items you made?",
      ne: "तपाईं सिलाइ वा हस्तकला गर्नुहुन्छ। आफूले बनाएका लुगा वा सामानका फोटो देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "Close-ups of stitching or finishing help most.", ne: "सिलाइ वा फिनिसिङको नजिकको फोटो सबैभन्दा उपयोगी।" },
  },
  cooking: {
    question: {
      en: "Can you show photos of food you prepared or your kitchen setup?",
      ne: "तपाईंले बनाएको खाना वा भान्साको तयारीको फोटो देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "The food and workspace, not people.", ne: "खाना र काम गर्ने ठाउँ, मानिस होइन।" },
  },
  teaching: {
    question: {
      en: "Can you show a lesson plan, worksheet or notes you made for teaching?",
      ne: "पढाउन बनाएको पाठ योजना, वर्कसिट वा नोट देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "Please don't include photos of children.", ne: "कृपया बालबालिकाको फोटो नराख्नुहोस्।" },
  },
  driving: {
    question: {
      en: "Can you show your driving licence category page or the vehicle you drive?",
      ne: "सवारी चालक अनुमतिपत्रको वर्ग देखिने भाग वा चलाउने सवारीको फोटो देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "Cover the licence number.", ne: "अनुमतिपत्र नम्बर छोप्नुहोस्।" },
  },
  professionalism: {
    question: {
      en: "Can you show a letter, certificate or message of thanks from someone you worked for?",
      ne: "तपाईंले काम गरेको ठाउँबाट पाएको पत्र, प्रमाणपत्र वा धन्यवाद सन्देश देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "Cover phone numbers and signatures.", ne: "फोन नम्बर र हस्ताक्षर छोप्नुहोस्।" },
  },
  "physical-fitness": {
    question: {
      en: "Can you show work you did with your hands, like a building, field or job site?",
      ne: "हातले गरेको काम, जस्तै निर्माण, खेत वा काम गर्ने ठाउँको फोटो देखाउन सक्नुहुन्छ?",
    },
    hint: { en: "Show the work, not faces.", ne: "काम देखाउनुहोस्, अनुहार होइन।" },
  },
};
