"use client";

import { levelName } from "@/lib/levels";
import { MODES } from "@/lib/quiz";
import type { RunSummary } from "@/lib/run";
import { SpeakButton } from "./SpeakButton";

type Props = {
  run: RunSummary;
  isHighScore: boolean;
  canSpeak: boolean;
  speak: (text: string) => void;
  onPlayAgain: () => void;
  onMenu: () => void;
};

export function Results({
  run,
  isHighScore,
  canSpeak,
  speak,
  onPlayAgain,
  onMenu,
}: Props) {
  const asked = run.results.length;
  const accuracy = asked === 0 ? 0 : Math.round((run.correctCount / asked) * 100);
  const modeName = MODES.find((m) => m.id === run.mode)?.name ?? run.mode;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <p className="text-xs uppercase tracking-widest text-slate-400">
          {levelName(run.level)} · {modeName}
        </p>
        <p className="mt-2 font-mono text-6xl font-extrabold tabular-nums text-cyan-300">
          {run.score}
        </p>
        {isHighScore && (
          <p className="mt-1 text-sm font-semibold text-fuchsia-400">
            New high score
          </p>
        )}
      </header>

      <dl className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Accuracy" value={accuracy + "%"} />
        <Stat label="Correct" value={String(run.correctCount)} />
        <Stat label="Streak" value={String(run.bestStreak)} />
      </dl>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          {run.missed.length > 0 ? "Review these" : "Nothing missed"}
        </h2>
        {run.missed.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
            You answered every character you saw. Try a faster level.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {run.missed.map((card) => (
              <li
                key={card.id}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3"
              >
                <span className="font-ko w-14 text-center text-4xl text-slate-50">
                  {card.char}
                </span>
                <span className="flex-1 font-mono text-lg text-cyan-300">
                  {card.rom}
                </span>
                {canSpeak && (
                  <SpeakButton
                    text={card.speak}
                    label={"Hear " + card.char}
                    onSpeak={speak}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onPlayAgain}
          className="min-h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-lg font-bold text-slate-950 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          Play again
        </button>
        <button
          type="button"
          onClick={onMenu}
          className="min-h-14 rounded-xl border border-slate-700 text-base font-semibold text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          Back to menu
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <dt className="text-[11px] uppercase tracking-widest text-slate-400">
        {label}
      </dt>
      <dd className="font-mono text-xl font-bold tabular-nums text-slate-100">
        {value}
      </dd>
    </div>
  );
}
