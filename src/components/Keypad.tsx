"use client";

import { useState } from "react";
import { KEY_TO_JAMO } from "@/lib/keyboard";

/**
 * The dubeolsik keyboard, on screen.
 *
 * It is the input on a phone and a reference on a desktop, and it is the same
 * layout either way — so the thumb that learns where ㄱ lives is teaching the
 * finger that will reach for `r` later. Consonants left, vowels right, exactly
 * as the standard arranges them.
 */

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const SHIFTABLE = new Set(["q", "w", "e", "r", "t", "o", "p"]);

type Props = {
  /** The key the current target wants next, lowercase or uppercase. */
  expectedKey: string | null;
  onJamo: (jamo: string) => void;
  disabled?: boolean;
};

export function Keypad({ expectedKey, onJamo, disabled = false }: Props) {
  const [shifted, setShifted] = useState(false);

  const press = (key: string) => {
    const effective = shifted && SHIFTABLE.has(key) ? key.toUpperCase() : key;
    const jamo = KEY_TO_JAMO[effective];
    if (jamo) onJamo(jamo);
    if (shifted) setShifted(false);
  };

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex w-full justify-center gap-1.5">
          {rowIndex === 2 && (
            <button
              type="button"
              onClick={() => setShifted((on) => !on)}
              aria-pressed={shifted}
              aria-label="Double consonants"
              className={
                "min-h-12 flex-1 rounded-lg border text-lg transition-colors " +
                (shifted
                  ? "border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-100"
                  : "border-slate-700 bg-slate-800/70 text-slate-400")
              }
            >
              ⇧
            </button>
          )}
          {row.map((key) => {
            const effective = shifted && SHIFTABLE.has(key) ? key.toUpperCase() : key;
            const jamo = KEY_TO_JAMO[effective];
            const isNext =
              expectedKey !== null &&
              expectedKey.toLowerCase() === key &&
              (expectedKey === expectedKey.toLowerCase()) === !shifted;

            return (
              <button
                key={key}
                type="button"
                onClick={() => press(key)}
                disabled={disabled}
                aria-label={jamo}
                className={
                  "font-ko min-h-12 flex-1 rounded-lg border text-xl transition-colors " +
                  (isNext
                    ? "border-cyan-300 bg-cyan-400/25 text-cyan-50"
                    : "border-slate-700 bg-slate-800/70 text-slate-200 enabled:active:bg-slate-700")
                }
              >
                {jamo}
                <span className="block text-[9px] leading-none text-slate-500 uppercase">
                  {key}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
