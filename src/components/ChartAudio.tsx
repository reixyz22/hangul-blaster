"use client";

import { useEffect } from "react";
import { useKoreanSpeech } from "@/lib/speech";

/**
 * Audio for the reference chart.
 *
 * The chart is a hundred buttons of static markup; hydrating each one as its
 * own React component cost seconds of main-thread time on a mid-range phone.
 * Instead the page ships as plain HTML with the syllable to speak in a
 * `data-speak` attribute, and this island — the only client code on the page —
 * delegates one click listener for the lot.
 *
 * The buttons render disabled, so they are inert until this says otherwise.
 */
export function ChartAudio() {
  const { speak, supported } = useKoreanSpeech();

  useEffect(() => {
    const buttons =
      document.querySelectorAll<HTMLButtonElement>("button[data-speak]");

    if (supported !== true) {
      // Still settling, or no Korean voice: leave them inert.
      document.documentElement.dataset.koAudio =
        supported === false ? "off" : "unknown";
      return;
    }

    document.documentElement.dataset.koAudio = "on";
    for (const button of buttons) button.disabled = false;

    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-speak]",
      );
      if (target?.dataset.speak) speak(target.dataset.speak);
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      for (const button of buttons) button.disabled = true;
    };
  }, [speak, supported]);

  return null;
}
