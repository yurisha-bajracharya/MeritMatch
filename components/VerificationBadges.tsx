"use client";

import { useId, useState } from "react";
import Icon from "./Icon";
import type { EmployerBadges, Lang } from "@/lib/types";

type Key = "contact" | "documents" | "employer" | "job";
const L = (en: string, ne: string): Record<Lang, string> => ({ en, ne });

/** Exact wording of what each badge means, and what it does NOT mean. */
export const BADGE_TEXT: Record<Key, { label: Record<Lang, string>; body: Record<Lang, string> }> = {
  contact: {
    label: L("Contact Verified", "सम्पर्क प्रमाणित"),
    body: L(
      "The employer confirmed their mobile number with a one-time code and named the person responsible for hiring. Their business has not necessarily been reviewed.",
      "रोजगारदाताले एक पटके कोडबाट मोबाइल नम्बर पुष्टि गरे र भर्ना हेर्ने व्यक्तिको नाम दिए। व्यवसायको समीक्षा भइसकेको नहुन सक्छ।",
    ),
  },
  documents: {
    label: L("Business Documents Reviewed", "व्यवसायका कागजात हेरिएको"),
    body: L(
      "A MeritMatch reviewer looked at a business document such as a PAN or registration. We have not confirmed it with a government office, and we do not guarantee the business.",
      "मेरिटम्याचका समीक्षकले प्यान वा दर्ता जस्ता व्यवसायिक कागजात हेरे। सरकारी कार्यालयसँग पुष्टि गरिएको होइन, र हामी व्यवसायको ग्यारेन्टी गर्दैनौं।",
    ),
  },
  employer: {
    label: L("Employer Verified", "रोजगारदाता प्रमाणित"),
    body: L(
      "MeritMatch has reviewed the employer's contact, identity and business evidence. This does not guarantee that every job or future interaction is safe. No physical inspection was made unless stated.",
      "मेरिटम्याचले रोजगारदाताको सम्पर्क, पहिचान र व्यवसायका प्रमाण हेरेको छ। यसले हरेक काम वा भविष्यको व्यवहार सुरक्षित हुने ग्यारेन्टी गर्दैन। उल्लेख नभएसम्म स्थलगत निरीक्षण गरिएको छैन।",
    ),
  },
  job: {
    label: L("Job Verified", "काम प्रमाणित"),
    body: L(
      "A reviewer checked this vacancy's details: role, salary, location, hours, and the employer's promise not to charge applicants. Report anything that turns out different.",
      "समीक्षकले यो कामको विवरण जाँचे: भूमिका, तलब, स्थान, समय, र आवेदकसँग शुल्क नलिने रोजगारदाताको प्रतिज्ञा। फरक भेटिए रिपोर्ट गर्नुहोस्।",
    ),
  },
};

/**
 * Small badges that explain themselves on tap. Only true badges are shown;
 * the strongest employer badge replaces the weaker ones it includes.
 */
export default function VerificationBadges({
  badges,
  jobVerified,
  lang,
  size = "sm",
}: {
  badges?: EmployerBadges;
  jobVerified?: boolean;
  lang: Lang;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState<Key | null>(null);
  const uid = useId();
  const keys: Key[] = [];
  if (jobVerified) keys.push("job");
  if (badges?.employer) keys.push("employer");
  else {
    if (badges?.documents) keys.push("documents");
    if (badges?.contact) keys.push("contact");
  }
  if (keys.length === 0) return null;

  return (
    <div className={size === "md" ? "space-y-2" : ""}>
      <div className="flex flex-wrap items-center gap-2">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setOpen(open === k ? null : k)}
            aria-expanded={open === k}
            aria-controls={`${uid}-${k}`}
            className={`badge-moss cursor-pointer hover:ring-1 hover:ring-moss/40 ${size === "md" ? "!text-sm !py-1" : ""}`}
          >
            <Icon name="check-circle" size={size === "md" ? 15 : 13} />
            {BADGE_TEXT[k].label[lang]}
            <Icon name="info" size={size === "md" ? 14 : 12} className="opacity-70" />
          </button>
        ))}
      </div>
      {open && (
        <p id={`${uid}-${open}`} className="mt-2 rounded-md border border-moss/20 bg-moss-light/50 p-3 text-sm text-ink" role="note">
          <span className="font-semibold">{BADGE_TEXT[open].label[lang]}: </span>
          {BADGE_TEXT[open].body[lang]}
        </p>
      )}
    </div>
  );
}
