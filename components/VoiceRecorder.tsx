"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((e: {
        resultIndex: number;
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
};
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Props = {
  lang: Lang;
  /** Called with each finalised phrase to append to the answer. */
  onText: (text: string) => void;
};

export default function VoiceRecorder({ lang, onText }: Props) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    setSupported(getCtor() !== null);
    return () => rec.current?.stop();
  }, []);

  function toggle() {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const Ctor = getCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = lang === "ne" ? "ne-NP" : "en-US";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal)
          onTextRef.current(e.results[i][0].transcript.trim());
      }
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  }

  if (supported === false) {
    return <p className="text-sm text-ink/75">{t(lang, "voiceUnsupported")}</p>;
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={supported === null}
        aria-pressed={listening}
        className={`btn ${listening ? "btn-proof" : "btn-quiet"}`}
      >
        {listening ? t(lang, "stopMic") : t(lang, "startMic")}
      </button>
      <span className="text-sm" aria-live="polite">
        {listening ? t(lang, "listening") : t(lang, "voiceHint")}
      </span>
    </div>
  );
}
