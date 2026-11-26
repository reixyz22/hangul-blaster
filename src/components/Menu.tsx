"use client";

import Link from "next/link";
import { LEVELS, poolFor } from "@/lib/levels";
import { MODES, type Mode } from "@/lib/quiz";
import { accuracyOf, UNLOCK_THRESHOLD, type Progress } from "@/lib/storage";

type Props = {
  progress: Progress;
  level: number;
  mode: Mode;
  listenSupported: boolean | null;
  onLevelChange: (level: number) => void;
  onModeChange: (mode: Mode) => void;
  onStart: () => void;
  onReset: () => void;
};

/** Share of a level's characters the player has answered correctly at least once. */
function levelMastery(levelId: number, progress: Progress): number {
  const pool = poolFor(levelId);
  if (pool.length === 0) return 0;
  const known = pool.filter((card) => {
    const accuracy = accuracyOf(progress.stats[card.id]);
    return accuracy !== null && accuracy >= 0.75;
  }).length;
  return known / pool.length;
}

export function Menu({
  progress,
  level,
  mode,
  listenSupported,
  onLevelChange,
  onModeChange,
  onStart,
  onReset,
}: Props) {
  const modes = MODES.filter((m) => m.id !== "listen" || listenSupported);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <p className="font-ko text-5xl font-bold text-cyan-300">한글</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-50">
          Hangul Blaster
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Shoot down the Korean alphabet before it lands.
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <dt className="text-[11px] uppercase tracking-widest text-slate-400">
            High score
          </dt>
          <dd className="font-mono text-2xl font-bold tabular-nums text-cyan-300">
            {progress.highScore}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <dt className="text-[11px] uppercase tracking-widest text-slate-400">
            Best streak
          </dt>
          <dd className="font-mono text-2xl font-bold tabular-nums text-fuchsia-400">
            {progress.bestStreak}
          </dd>
        </div>
      </dl>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Mode
        </h2>
        <div className="flex flex-col gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeChange(m.id)}
              aria-pressed={mode === m.id}
              className={
                "flex min-h-14 items-center justify-between rounded-xl border px-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 " +
                (mode === m.id
                  ? "border-cyan-400 bg-cyan-500/15 text-slate-50"
                  : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800")
              }
            >
              <span className="font-semibold">{m.name}</span>
              <span className="font-ko text-xs text-slate-400">{m.blurb}</span>
            </button>
          ))}
        </div>
        {listenSupported === false && (
          <p className="mt-2 text-xs text-slate-400">
            Listen mode is hidden: this device has no Korean voice installed.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Level
        </h2>
        <ul className="flex flex-col gap-2">
          {LEVELS.map((lvl) => {
            const mastery = levelMastery(lvl.id, progress);
            const unlocked = lvl.id <= progress.unlockedLevel;
            return (
              <li key={lvl.id}>
                <button
                  type="button"
                  onClick={() => onLevelChange(lvl.id)}
                  aria-pressed={level === lvl.id}
                  className={
                    "w-full rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 " +
                    (level === lvl.id
                      ? "border-cyan-400 bg-cyan-500/15"
                      : "border-slate-800 bg-slate-900/60 hover:bg-slate-800")
                  }
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-slate-100">
                      {lvl.id}. {lvl.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {unlocked ? Math.round(mastery * 100) + "%" : "not yet earned"}
                    </span>
                  </span>
                  <span className="font-ko mt-1 block truncate text-sm text-slate-400">
                    {lvl.blurb}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-2 block h-1 overflow-hidden rounded-full bg-slate-800"
                  >
                    <span
                      className="block h-full rounded-full bg-cyan-400"
                      style={{ width: Math.round(mastery * 100) + "%" }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-slate-400">
          Every level is playable from the start. Get {UNLOCK_THRESHOLD} right in
          a run to earn the next one.
        </p>
      </section>

      <button
        type="button"
        onClick={onStart}
        className="min-h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-lg font-bold text-slate-950 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
      >
        Play
      </button>

      <div className="flex items-center justify-between">
        <Link
          href="/chart"
          className="flex min-h-12 items-center rounded-xl px-3 text-sm font-medium text-cyan-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          Reference chart
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="min-h-12 rounded-xl px-3 text-sm text-slate-400 transition-colors hover:text-rose-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          Reset progress
        </button>
      </div>
    </div>
  );
}
