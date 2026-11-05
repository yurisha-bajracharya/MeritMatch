"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Lang } from "./types";

/**
 * ONE language for the whole app.
 *
 * Before, every page and component kept its own `lang` state, so switching
 * language in the navbar changed the navbar and nothing else. Now the choice
 * lives in one place (localStorage, with an in-memory fallback), every
 * component reads it, and it is still Nepali when you go to the next page.
 */
const KEY = "mm_lang";
const EVENT = "mm-lang-change";
let memory: Lang = "en"; // used if storage is blocked (private mode etc.)

function read(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "ne" || v === "en") return v;
  } catch {}
  return memory;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore<Lang>(subscribe, read, () => "en");
  const setLang = useCallback((l: Lang) => {
    memory = l;
    try {
      localStorage.setItem(KEY, l);
    } catch {}
    document.documentElement.lang = l;
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [lang, setLang];
}
