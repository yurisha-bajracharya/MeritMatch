"use client";

import { useRef, useState, useEffect } from "react";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";

type Props = {
  lang: Lang;
  onResult: (text: string) => void;
};

export default function VoiceRecorder({ lang, onResult }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = lang === "ne" ? "ne-NP" : "en-US";

    recog.onresult = (e: any) => {
      const last = e.results[e.results.length - 1];
      if (last.isFinal) onResult(last[0].transcript);
    };

    recog.onerror = () => setListening(false);
    recog.onend = () => setListening(false);

    recogRef.current = recog;
  }, [lang, onResult]);

  if (!supported) {
    return (
      <p className="text-xs text-ink-muted italic">
        {t("voiceUnsupported", lang)}
      </p>
    );
  }

  const toggle = () => {
    if (listening) {
      recogRef.current?.stop();
    } else {
      recogRef.current?.start();
      setListening(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`btn-sm ${listening ? "btn-danger" : "btn-secondary"} gap-1.5`}
      type="button"
    >
      {listening ? (
        <>
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          {t("recording", lang)}
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          {t("tapToSpeak", lang)}
        </>
      )}
    </button>
  );
}
