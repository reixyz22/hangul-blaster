"use client";

import { keyCapFor } from "@/lib/keyboard";
import { mnemonicFor } from "@/lib/mnemonics";
import type { Progress, RunSummary } from "@/lib/storage";
import { currentStreak } from "@/lib/storage";
import { SpeakButton } from "./SpeakButton";

type Props = {
  run: RunSummary;
  progress: Progress;
  isHighScore: boolean;
  canSpeak: boolean;
  speak: (text: string) => void;
  onAgain: () => void;
};

export function RunStats({
  run,
  progress,
  isHighScore,
  canSpeak,
  speak,
  onAgain,
}: Props) {
  const accuracy =
    run.keystrokes === 0
      ? 0
      : Math.round(((run.keystrokes - run.misfires) / run.keystrokes) * 100);
  const days = currentStreak(progress.streak);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-8">
      <header className="text-center">
        <p className="font-mono text-6xl font-extrabold tabular-nums text-cyan-300">
          {run.score}
        </p>
        {isHighScore && (
          <p className="mt-1 text-sm font-semibold text-fuchsia-400">
            New best
          </p>
        )}
      </header>

      <dl className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Wave" value={String(run.wave)} />
        <Stat label="Accuracy" value={accuracy + "%"} />
        <Stat label="Best streak" value={String(progress.streak.best)} />
      </dl>

      <p className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-center">
        <span className="block font-mono text-3xl font-bold tabular-nums text-cyan-200">
          {days}
        </span>
        <span className="text-xs tracking-widest text-cyan-200/70 uppercase">
          {days === 1 ? "day in a row" : "days in a row"}
        </span>
      </p>

      {run.missed.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold tracking-widest text-slate-400 uppercase">
            Got through
          </h2>
          <ul className="flex flex-col gap-2">
            {run.missed.map((miss) => (
              <li
                key={miss.char}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3"
              >
                <span className="font-ko w-14 text-center text-4xl text-slate-50">
                  {miss.char}
                </span>
                <span className="font-ko flex-1 text-sm text-slate-400">
                  {miss.jamo.join(" ")}
                  <span className="mt-0.5 block font-mono text-xs text-slate-500 uppercase">
                    {miss.jamo.map(keyCapFor).join("  ")}
                  </span>
                </span>
                {canSpeak && (
                  <SpeakButton
                    text={miss.char}
                    label={"Hear " + miss.char}
                    onSpeak={speak}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <WeakLetters progress={progress} canSpeak={canSpeak} speak={speak} />

      <button
        type="button"
        onClick={onAgain}
        className="min-h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-lg font-bold text-slate-950 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
      >
        <span className="font-ko">다시</span>
      </button>
    </div>
  );
}

/** The three letters the weighting will be throwing at you most. */
function WeakLetters({
  progress,
  canSpeak,
  speak,
}: {
  progress: Progress;
  canSpeak: boolean;
  speak: (text: string) => void;
}) {
  const weak = Object.entries(progress.stats)
    .filter(([, stat]) => stat.seen >= 3)
    .map(([jamo, stat]) => ({ jamo, accuracy: stat.hit / stat.seen }))
    .filter((entry) => entry.accuracy < 0.8)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  if (weak.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold tracking-widest text-slate-400 uppercase">
        Coming back for you
      </h2>
      <ul className="flex flex-col gap-2">
        {weak.map(({ jamo }) => {
          const mnemonic = mnemonicFor(jamo);
          return (
            <li
              key={jamo}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3"
            >
              <span className="font-ko w-14 text-center text-4xl text-fuchsia-300">
                {jamo}
              </span>
              <span className="flex-1">
                {mnemonic && (
                  <span className="font-ko block text-lg text-slate-100">
                    {mnemonic.word}
                  </span>
                )}
                <span className="block font-mono text-xs text-slate-500 uppercase">
                  {keyCapFor(jamo)}
                </span>
              </span>
              {canSpeak && mnemonic && (
                <SpeakButton
                  text={mnemonic.word}
                  label={"Hear " + mnemonic.word}
                  onSpeak={speak}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <dt className="text-xs tracking-widest text-slate-400 uppercase">
        {label}
      </dt>
      <dd className="font-mono text-xl font-bold tabular-nums text-slate-100">
        {value}
      </dd>
    </div>
  );
}
