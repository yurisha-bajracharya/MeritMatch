import type { InputMode, Lang } from "./types";

// Shared-device mode lives in sessionStorage, so it ends when the tab closes.
// While it is on, nothing is written to localStorage.
const FLAG = "mm:shared";
const PREFIX = "mm:";

export type Draft = {
  lang: Lang;
  mode: InputMode;
  answers: Record<string, string>;
  index: number;
  /** Epoch ms when the timer runs out, or null before the task starts. */
  endAt: number | null;
};

function attempt<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    // Storage can be blocked (private mode, full quota); behave as if empty.
    return fallback;
  }
}

export const isShared = () => attempt(() => sessionStorage.getItem(FLAG) === "1", false);

/** Removes everything MeritMatch has stored on this device (the shared flag itself stays). */
export function wipeAll() {
  attempt(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith(PREFIX)) localStorage.removeItem(key);
  }, undefined);
}

export function setShared(on: boolean) {
  attempt(() => {
    if (on) {
      sessionStorage.setItem(FLAG, "1");
      wipeAll();
    } else {
      sessionStorage.removeItem(FLAG);
    }
  }, undefined);
}

const draftKey = (jobId: string) => `${PREFIX}draft:${jobId}`;

export function saveDraft(jobId: string, draft: Draft) {
  if (isShared()) return;
  attempt(() => localStorage.setItem(draftKey(jobId), JSON.stringify(draft)), undefined);
}

export function loadDraft(jobId: string): Draft | null {
  if (isShared()) return null;
  return attempt(() => {
    const d = JSON.parse(localStorage.getItem(draftKey(jobId)) ?? "null");
    if (!d || typeof d.answers !== "object" || (d.lang !== "en" && d.lang !== "ne")) return null;
    return {
      lang: d.lang,
      mode: d.mode === "voice" ? "voice" : "text",
      answers: d.answers,
      index: Number.isInteger(d.index) && d.index >= 0 ? d.index : 0,
      endAt: typeof d.endAt === "number" ? d.endAt : null,
    } satisfies Draft;
  }, null);
}

export function clearDraft(jobId: string) {
  attempt(() => localStorage.removeItem(draftKey(jobId)), undefined);
}
