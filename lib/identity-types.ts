import type { Lang } from "./types";

export const ID_TYPES = ["citizenship", "nid", "passport", "licence", "voter"] as const;
export type IdType = (typeof ID_TYPES)[number];
export type IdStatus = "none" | "submitted" | "needs_info" | "approved" | "rejected";

export const ID_LABEL: Record<IdType, Record<Lang, string>> = {
  citizenship: { en: "Citizenship certificate", ne: "नागरिकता प्रमाणपत्र" },
  nid: { en: "National ID card", ne: "राष्ट्रिय परिचयपत्र" },
  passport: { en: "Passport", ne: "राहदानी" },
  licence: { en: "Driving licence", ne: "सवारी चालक अनुमतिपत्र" },
  voter: { en: "Voter ID card", ne: "मतदाता परिचयपत्र" },
};
