"use client";

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";
import { Blaster } from "@/components/Blaster";
import { RunStats } from "@/components/RunStats";
import { useKoreanSpeech } from "@/lib/speech";
import {
  applyRun,
  commitProgress,
  currentStreak,
  progressSnapshot,
  serverProgressSnapshot,
  subscribeProgress,
  type RunSummary,
} from "@/lib/storage";

type Screen = "ready" | "playing" | "stats";

export default function Home() {
  const progress = useSyncExternalStore(
    subscribeProgress,
    progressSnapshot,
    serverProgressSnapshot,
  );

  const [screen, setScreen] = useState<Screen>("ready");
  const [run, setRun] = useState<RunSummary | null>(null);
  const [isHighScore, setIsHighScore] = useState(false);
  const [runId, setRunId] = useState(0);

  const { speak, supported } = useKoreanSpeech();

  const start = useCallback(() => {
    // Browsers only let speech synthesis start from a gesture, so the first
    // press of the run is also what buys us the voice for the whole run.
    speak(" ");
    setRunId((id) => id + 1);
    setScreen("playing");
  }, [speak]);

  const finish = useCallback(
    (summary: RunSummary) => {
      setIsHighScore(summary.score > progress.highScore);
      commitProgress(applyRun(progress, summary));
      setRun(summary);
      setScreen("stats");
    },
    [progress],
  );

  if (screen === "playing") {
    return (
      <main className="flex-1">
        <Blaster
          key={runId}
          baseStats={progress.stats}
          speak={speak}
          onFinish={finish}
          onQuit={() => setScreen("ready")}
        />
      </main>
    );
  }

  if (screen === "stats" && run) {
    return (
      <main className="flex-1">
        <RunStats
          run={run}
          progress={progress}
          isHighScore={isHighScore}
          canSpeak={supported === true}
          speak={speak}
          onAgain={start}
        />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <button
        type="button"
        onClick={start}
        className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-cyan-400"
      >
        <span className="font-ko text-6xl font-bold text-cyan-300">한글</span>
        <span className="font-ko animate-pulse text-2xl text-slate-100">
          시작
        </span>
        <span className="flex gap-6 text-center">
          <span>
            <span className="block font-mono text-2xl font-bold tabular-nums text-fuchsia-400">
              {currentStreak(progress.streak)}
            </span>
            <span className="text-xs tracking-widest text-slate-400 uppercase">
              day streak
            </span>
          </span>
          <span>
            <span className="block font-mono text-2xl font-bold tabular-nums text-cyan-300">
              {progress.highScore}
            </span>
            <span className="text-xs tracking-widest text-slate-400 uppercase">
              best
            </span>
          </span>
        </span>
      </button>

      <Link
        href="/chart"
        className="mx-auto mb-4 flex min-h-12 items-center rounded-xl px-4 text-sm text-slate-400 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
      >
        <span className="font-ko">자판</span>
      </Link>
    </main>
  );
}
