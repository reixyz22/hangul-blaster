"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Snapshot value meaning "the browser hasn't given us its voice list yet". */
const UNKNOWN = "?";

function hasSynth(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function subscribe(onChange: () => void): () => void {
  if (!hasSynth()) return () => {};
  const synth = window.speechSynthesis;
  synth.addEventListener("voiceschanged", onChange);
  // Some browsers fill the list without ever firing the event, so poll a few
  // times early on and then stop.
  const timers = [300, 1000, 2500].map((ms) => window.setTimeout(onChange, ms));
  return () => {
    synth.removeEventListener("voiceschanged", onChange);
    for (const timer of timers) window.clearTimeout(timer);
  };
}

/** The Korean voice's URI, "" for none, or UNKNOWN while the list is empty. */
function getSnapshot(): string {
  if (!hasSynth()) return "";
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return UNKNOWN;
  const korean = voices.find((v) => v.lang.toLowerCase().startsWith("ko"));
  return korean ? korean.voiceURI : "";
}

function getServerSnapshot(): string {
  return UNKNOWN;
}

/**
 * Korean speech synthesis, if this device has a Korean voice.
 *
 * `supported` is `null` until the browser reports its voices, so the Listen
 * mode can stay hidden rather than flickering in and out.
 */
export function useKoreanSpeech() {
  const voiceURI = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const supported = voiceURI === UNKNOWN ? null : voiceURI !== "";

  const speak = useCallback(
    (text: string) => {
      if (!hasSynth()) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.rate = 0.85;
      const voice = synth.getVoices().find((v) => v.voiceURI === voiceURI);
      if (voice) utterance.voice = voice;
      synth.speak(utterance);
    },
    [voiceURI],
  );

  return { speak, supported };
}
