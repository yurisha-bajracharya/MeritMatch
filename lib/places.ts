import type { Bilingual } from "./types";

/**
 * Nepal's main hiring cities, grouped by province.
 *
 * Why a fixed list instead of free text: "Pokhara", "pokhara", "पोखरा" and
 * "Lakeside, Pokhara" must all be the SAME place or location matching is
 * meaningless. Every job location and every candidate preference resolves
 * to one of these ids.
 */

export type City = {
  id: string;
  name: Bilingual;
  province: string;
  /** Other spellings people really type, matched as whole words. */
  aliases?: string[];
};

export const PROVINCES: Record<string, Bilingual> = {
  koshi: { en: "Koshi", ne: "कोशी" },
  madhesh: { en: "Madhesh", ne: "मधेश" },
  bagmati: { en: "Bagmati", ne: "बागमती" },
  gandaki: { en: "Gandaki", ne: "गण्डकी" },
  lumbini: { en: "Lumbini", ne: "लुम्बिनी" },
  karnali: { en: "Karnali", ne: "कर्णाली" },
  sudurpashchim: { en: "Sudurpashchim", ne: "सुदूरपश्चिम" },
};

export const CITIES: City[] = [
  { id: "kathmandu", name: { en: "Kathmandu", ne: "काठमाडौं" }, province: "bagmati", aliases: ["ktm", "काठमाडौँ"] },
  { id: "lalitpur", name: { en: "Lalitpur", ne: "ललितपुर" }, province: "bagmati", aliases: ["patan"] },
  { id: "bhaktapur", name: { en: "Bhaktapur", ne: "भक्तपुर" }, province: "bagmati" },
  { id: "bharatpur", name: { en: "Bharatpur", ne: "भरतपुर" }, province: "bagmati", aliases: ["chitwan", "चितवन"] },
  { id: "hetauda", name: { en: "Hetauda", ne: "हेटौंडा" }, province: "bagmati", aliases: ["हेटौडा"] },
  { id: "pokhara", name: { en: "Pokhara", ne: "पोखरा" }, province: "gandaki" },
  { id: "biratnagar", name: { en: "Biratnagar", ne: "विराटनगर" }, province: "koshi" },
  { id: "dharan", name: { en: "Dharan", ne: "धरान" }, province: "koshi" },
  { id: "itahari", name: { en: "Itahari", ne: "इटहरी" }, province: "koshi" },
  { id: "damak", name: { en: "Damak", ne: "दमक" }, province: "koshi" },
  { id: "birtamod", name: { en: "Birtamod", ne: "बिर्तामोड" }, province: "koshi" },
  { id: "birgunj", name: { en: "Birgunj", ne: "वीरगञ्ज" }, province: "madhesh", aliases: ["बीरगञ्ज", "birganj"] },
  { id: "janakpur", name: { en: "Janakpur", ne: "जनकपुर" }, province: "madhesh", aliases: ["janakpurdham"] },
  { id: "kalaiya", name: { en: "Kalaiya", ne: "कलैया" }, province: "madhesh" },
  { id: "butwal", name: { en: "Butwal", ne: "बुटवल" }, province: "lumbini" },
  { id: "siddharthanagar", name: { en: "Siddharthanagar", ne: "सिद्धार्थनगर" }, province: "lumbini", aliases: ["bhairahawa", "भैरहवा"] },
  { id: "nepalgunj", name: { en: "Nepalgunj", ne: "नेपालगञ्ज" }, province: "lumbini", aliases: ["nepalganj"] },
  { id: "ghorahi", name: { en: "Ghorahi", ne: "घोराही" }, province: "lumbini", aliases: ["dang", "दाङ"] },
  { id: "tulsipur", name: { en: "Tulsipur", ne: "तुल्सीपुर" }, province: "lumbini" },
  { id: "surkhet", name: { en: "Surkhet", ne: "सुर्खेत" }, province: "karnali", aliases: ["birendranagar", "वीरेन्द्रनगर"] },
  { id: "dhangadhi", name: { en: "Dhangadhi", ne: "धनगढी" }, province: "sudurpashchim" },
  { id: "bhimdatta", name: { en: "Bhimdatta", ne: "भीमदत्त" }, province: "sudurpashchim", aliases: ["mahendranagar", "महेन्द्रनगर"] },
];

/** A candidate preference meaning "I'll go wherever the job is". */
export const ANYWHERE = "anywhere";

export const ANYWHERE_LABEL: Bilingual = {
  en: "Open to anywhere in Nepal",
  ne: "नेपालको जुनसुकै ठाउँ",
};

const BY_ID = new Map(CITIES.map((c) => [c.id, c]));

export const cityById = (id: string): City | undefined => BY_ID.get(id);

export const cityName = (id: string, lang: "en" | "ne"): string =>
  id === ANYWHERE ? ANYWHERE_LABEL[lang] : (BY_ID.get(id)?.name[lang] ?? id);

/** Keep only ids we know, dedupe, cap the count. Safe on untrusted input. */
export function cleanCityIds(input: unknown, max = 8): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const raw of input) {
    const id = String(raw ?? "").trim().toLowerCase();
    if ((id === ANYWHERE || BY_ID.has(id)) && !out.includes(id)) out.push(id);
    if (out.length >= max) break;
  }
  return out;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function mentions(text: string, phrase: string): boolean {
  const p = phrase.toLowerCase();
  if (/^[a-z0-9 ]+$/.test(p)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRe(p)}([^a-z0-9]|$)`).test(text);
  }
  return text.includes(p);
}

/**
 * Find which city a free-text location refers to.
 * "Lakeside, Pokhara" -> "pokhara", "भक्तपुर" -> "bhaktapur", "Patan" -> "lalitpur".
 */
export function resolveCity(text: string): string | null {
  const lower = String(text ?? "").toLowerCase().trim();
  if (!lower) return null;
  for (const c of CITIES) {
    const names = [c.name.en, c.name.ne, ...(c.aliases ?? [])];
    if (names.some((n) => mentions(lower, n))) return c.id;
  }
  return null;
}

/**
 * How well a job's city fits what a candidate said they want.
 *  preferred : the job city is one of their chosen cities
 *  anywhere  : they said they are open to anywhere
 *  elsewhere : they chose specific cities and this is not one of them
 *  unknown   : they chose nothing, or the job location is blank/unrecognised
 */
export type LocationFit = "preferred" | "anywhere" | "elsewhere" | "unknown";

export function locationFit(jobLocation: string, preferred: string[]): LocationFit {
  if (!preferred || preferred.length === 0) return "unknown";
  const jobCity = resolveCity(jobLocation);
  if (!jobCity) return "unknown";
  if (preferred.includes(jobCity)) return "preferred";
  if (preferred.includes(ANYWHERE)) return "anywhere";
  return "elsewhere";
}

/** Numeric weight of a fit, used when blending with the skill score. */
export const FIT_WEIGHT: Record<LocationFit, number> = {
  preferred: 1,
  anywhere: 0.8,
  unknown: 0.5,
  elsewhere: 0,
};
