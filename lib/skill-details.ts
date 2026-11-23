import type { Bilingual, Lang } from "./types";

/**
 * Follow-up questions after the Experience Mapper: "how long, where, what
 * exactly, with what". The answers turn "I know accounting" into a clear line
 * an employer can read, and make experienced skills count more in job
 * matching. Everything here is still the person's own description; it is
 * labelled that way wherever it is shown. Client-safe (no server imports).
 */

const b = (en: string, ne: string): Bilingual => ({ en, ne });

export type Years = "lt6m" | "6to12m" | "1to3y" | "3plus";
export type Where = "family" | "own" | "job" | "community" | "home";

export const YEARS: Record<Years, Bilingual> = {
  lt6m: b("Under 6 months", "६ महिनाभन्दा कम"),
  "6to12m": b("6 to 12 months", "६ देखि १२ महिना"),
  "1to3y": b("1 to 3 years", "१ देखि ३ वर्ष"),
  "3plus": b("More than 3 years", "३ वर्षभन्दा बढी"),
};

export const WHERE: Record<Where, Bilingual> = {
  family: b("Family business", "परिवारको व्यवसाय"),
  own: b("My own business", "आफ्नै व्यवसाय"),
  job: b("A job", "जागिर"),
  community: b("Group or community", "समूह वा समुदाय"),
  home: b("At home", "घरमा"),
};

export const TOOLS: Record<string, Bilingual> = {
  notebook: b("Notebook", "कापी"),
  calculator: b("Calculator", "क्याल्कुलेटर"),
  phone: b("Mobile phone", "मोबाइल"),
  excel: b("Excel or Sheets", "एक्सेल वा सिट"),
  software: b("Accounting software", "लेखा सफ्टवेयर"),
  wallet: b("eSewa or Khalti", "इसेवा वा खल्ती"),
  machine: b("Machine or tools", "मेसिन वा औजार"),
};

/** What the person may have done, per skill. Short, concrete, tappable. */
export const ACTIVITIES: Record<string, Record<string, Bilingual>> = {
  numeracy: {
    sales: b("Recorded daily sales", "दैनिक बिक्री लेखेँ"),
    credit: b("Kept the credit (udharo) list", "उधारोको हिसाब राखेँ"),
    cash: b("Matched cash with the books", "नगद र हिसाब मिलाएँ"),
    bills: b("Made bills for customers", "ग्राहकलाई बिल बनाएँ"),
    supplier: b("Paid suppliers", "सप्लायरलाई भुक्तानी गरेँ"),
    monthly: b("Made monthly totals", "मासिक जोड बनाएँ"),
    vat: b("Handled VAT bills", "भ्याट बिल सम्हालेँ"),
  },
  accuracy: {
    stock: b("Counted stock", "सामान गन्ती गरेँ"),
    measure: b("Took measurements", "नाप लिएँ"),
    forms: b("Filled forms carefully", "फारम ध्यान दिएर भरेँ"),
    checked: b("Checked others' work for mistakes", "अरूको काममा गल्ती जाँचेँ"),
    orders: b("Matched orders with deliveries", "अर्डर र डेलिभरी मिलाएँ"),
  },
  "data-entry": {
    register: b("Kept a register or list", "रजिस्टर वा सूची राखेँ"),
    sheet: b("Entered data in a spreadsheet", "स्प्रेडसिटमा डाटा हालेँ"),
    stocklist: b("Updated the stock list", "सामानको सूची अद्यावधिक गरेँ"),
    records: b("Kept customer records", "ग्राहकको अभिलेख राखेँ"),
  },
  "customer-service": {
    served: b("Served customers at a counter", "काउन्टरमा ग्राहकलाई सेवा दिएँ"),
    complaints: b("Handled complaints", "गुनासो सम्हालेँ"),
    explained: b("Explained products and prices", "सामान र मूल्य बुझाएँ"),
    regulars: b("Looked after regular customers", "नियमित ग्राहक सम्हालेँ"),
    phone: b("Took orders by phone", "फोनमा अर्डर लिएँ"),
  },
  communication: {
    notices: b("Wrote notices or posts", "सूचना वा पोस्ट लेखेँ"),
    meetings: b("Spoke in meetings", "बैठकमा बोलेँ"),
    calls: b("Made calls for work", "कामका लागि फोन गरेँ"),
    explain: b("Explained things to others", "अरूलाई कुरा बुझाएँ"),
  },
  organization: {
    events: b("Organised events", "कार्यक्रम मिलाएँ"),
    schedule: b("Made schedules", "तालिका बनाएँ"),
    ordering: b("Ordered stock on time", "समयमै सामान अर्डर गरेँ"),
    space: b("Kept the shop or store in order", "पसल वा स्टोर मिलाएर राखेँ"),
  },
  "digital-literacy": {
    social: b("Ran a social media page", "सामाजिक सञ्जाल पेज चलाएँ"),
    docs: b("Made documents on a computer", "कम्प्युटरमा कागजात बनाएँ"),
    payments: b("Took digital payments", "डिजिटल भुक्तानी लिएँ"),
    design: b("Made simple designs", "सजिलो डिजाइन बनाएँ"),
    email: b("Used email for work", "कामका लागि इमेल प्रयोग गरेँ"),
  },
  tailoring: {
    stitch: b("Stitched clothes", "लुगा सिलाएँ"),
    measure: b("Took body measurements", "शरीरको नाप लिएँ"),
    alter: b("Did alterations", "लुगा मिलाएँ"),
    embroidery: b("Did embroidery or crafts", "बुट्टा वा हस्तकला गरेँ"),
    orders: b("Took orders from customers", "ग्राहकबाट अर्डर लिएँ"),
  },
  cooking: {
    daily: b("Cooked daily meals for many", "धेरैका लागि दैनिक खाना पकाएँ"),
    events: b("Cooked for events", "कार्यक्रममा खाना पकाएँ"),
    snacks: b("Made snacks to sell", "बेच्न खाजा बनाएँ"),
    hygiene: b("Kept the kitchen clean and safe", "भान्सा सफा र सुरक्षित राखेँ"),
    buying: b("Bought ingredients within a budget", "बजेटभित्र सामग्री किनेँ"),
  },
  teaching: {
    tuition: b("Gave tuition", "ट्युसन पढाएँ"),
    class: b("Taught a class", "कक्षा पढाएँ"),
    plans: b("Made lesson plans", "पाठ योजना बनाएँ"),
    adults: b("Trained adults", "वयस्कलाई सिकाएँ"),
  },
  driving: {
    car: b("Drove a car or jeep", "कार वा जिप चलाएँ"),
    bike: b("Rode a motorbike for deliveries", "डेलिभरीका लागि बाइक चलाएँ"),
    heavy: b("Drove a heavy vehicle", "ठूलो सवारी चलाएँ"),
    routes: b("Planned routes", "बाटो योजना बनाएँ"),
  },
  teamwork: {
    group: b("Worked in a group or team", "समूहमा काम गरेँ"),
    shared: b("Shared work fairly", "काम बाँडेर गरेँ"),
    helped: b("Helped new members", "नयाँ सदस्यलाई सघाएँ"),
  },
  leadership: {
    led: b("Led a group", "समूहको नेतृत्व गरेँ"),
    trained: b("Trained others", "अरूलाई तालिम दिएँ"),
    decided: b("Made decisions for the business", "व्यवसायका निर्णय गरेँ"),
    savings: b("Ran a savings group", "बचत समूह चलाएँ"),
  },
  "problem-solving": {
    fixed: b("Fixed things that broke", "बिग्रेका चिज बनाएँ"),
    improved: b("Found a better way to work", "काम गर्ने राम्रो तरिका खोजेँ"),
    shortages: b("Handled shortages", "कमी हुँदा उपाय निकालेँ"),
  },
  "time-management": {
    deadlines: b("Met delivery deadlines", "समयमै डेलिभरी गरेँ"),
    juggled: b("Managed home and work together", "घर र काम सँगै सम्हालेँ"),
    routine: b("Kept a daily routine", "दैनिक दिनचर्या राखेँ"),
  },
  professionalism: {
    trusted: b("Trusted with money or keys", "पैसा वा साँचो सम्हाल्ने विश्वास पाएँ"),
    ontime: b("Always on time", "सधैं समयमै"),
    reference: b("Have someone who can vouch for me", "मेरोबारे भन्ने व्यक्ति छन्"),
  },
  "physical-fitness": {
    lifting: b("Lifted and carried goods", "सामान उठाएँ र बोकेँ"),
    farm: b("Farm work", "खेतीको काम"),
    building: b("Construction work", "निर्माणको काम"),
    standing: b("Long hours on my feet", "लामो समय उभिएर काम"),
  },
};

export type SkillDetail = {
  tag: string;
  years?: Years;
  where?: Where;
  did: string[];
  tools: string[];
};

/** Keep only known values. Used by the API before saving. */
export function cleanDetails(raw: unknown): SkillDetail[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 20).flatMap((r: any) => {
    const tag = String(r?.tag ?? "");
    if (!ACTIVITIES[tag]) return [];
    return [
      {
        tag,
        years: r.years in YEARS ? r.years : undefined,
        where: r.where in WHERE ? r.where : undefined,
        did: (Array.isArray(r.did) ? r.did : []).filter((d: string) => ACTIVITIES[tag][d]).slice(0, 8),
        tools: (Array.isArray(r.tools) ? r.tools : []).filter((t: string) => TOOLS[t]).slice(0, 6),
      },
    ];
  });
}

export const hasDetail = (d?: SkillDetail) => Boolean(d && (d.years || d.where || d.did.length));

/**
 * One clear line for employers, e.g.
 * "Recorded daily sales, kept the credit list, matched cash. 1 to 3 years, family business. Used a notebook and calculator."
 */
export function frameSkill(d: SkillDetail, lang: Lang): string {
  const acts = d.did.map((k) => ACTIVITIES[d.tag]?.[k]?.[lang]).filter(Boolean);
  const parts: string[] = [];
  if (acts.length) parts.push(acts.join(lang === "ne" ? ", " : ", ") + (lang === "ne" ? "।" : "."));
  const when = [d.years ? YEARS[d.years][lang] : "", d.where ? WHERE[d.where][lang] : ""].filter(Boolean).join(", ");
  if (when) parts.push(when + (lang === "ne" ? "।" : "."));
  if (d.tools.length)
    parts.push(
      lang === "ne"
        ? `प्रयोग: ${d.tools.map((t) => TOOLS[t].ne).join(", ")}।`
        : `Used: ${d.tools.map((t) => TOOLS[t].en.toLowerCase()).join(", ")}.`,
    );
  return parts.join(" ");
}

/** How much a described skill counts in job matching (1 = no details). */
export function detailWeight(d?: SkillDetail): number {
  if (!d) return 1;
  const y = { lt6m: 1, "6to12m": 1.2, "1to3y": 1.5, "3plus": 1.7 }[d.years ?? "lt6m"] ?? 1;
  return y + Math.min(d.did.length, 4) * 0.05;
}
