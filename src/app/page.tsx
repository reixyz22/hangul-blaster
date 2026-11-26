"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Game } from "@/components/Game";
import { Menu } from "@/components/Menu";
import { Results } from "@/components/Results";
import type { Mode } from "@/lib/quiz";
import type { RunSummary } from "@/lib/run";
import { useKoreanSpeech } from "@/lib/speech";
import {
  applyRun,
  commitProgress,
  progressSnapshot,
  resetProgress,
  serverProgressSnapshot,
  subscribeProgress,
} from "@/lib/storage";

type Screen = "menu" | "playing" | "results";

export default function Home() {
  const progress = useSyncExternalStore(
    subscribeProgress,
    progressSnapshot,
    serverProgressSnapshot,
  );

  const [screen, setScreen] = useState<Screen>("menu");
  // Null until the player picks: fall back to the furthest level they've earned.
  const [chosenLevel, setChosenLevel] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("letter-to-sound");
  const [run, setRun] = useState<RunSummary | null>(null);
  const [isHighScore, setIsHighScore] = useState(false);
  // Bumped on every new run so <Game> remounts with a clean slate.
  const [runId, setRunId] = useState(0);

  const { speak, supported: listenSupported } = useKoreanSpeech();

  const level = chosenLevel ?? progress.unlockedLevel;
  // Never strand the player in a mode this device cannot play.
  const effectiveMode =
    listenSupported === false && mode === "listen" ? "letter-to-sound" : mode;

  const start = useCallback(() => {
    setRunId((id) => id + 1);
    setScreen("playing");
  }, []);

  const finish = useCallback(
    (summary: RunSummary) => {
      setIsHighScore(summary.score > progress.highScore);
      commitProgress(applyRun(progress, summary));
      setRun(summary);
      setScreen("results");
    },
    [progress],
  );

  const reset = useCallback(() => {
    resetProgress();
    setChosenLevel(1);
  }, []);

  if (screen === "playing") {
    return (
      <main className="flex-1">
        <Game
          key={runId}
          level={level}
          mode={effectiveMode}
          baseStats={progress.stats}
          speak={speak}
          onFinish={finish}
          onExit={() => setScreen("menu")}
        />
      </main>
    );
  }

  if (screen === "results" && run) {
    return (
      <main className="flex-1">
        <Results
          run={run}
          isHighScore={isHighScore}
          canSpeak={listenSupported === true}
          speak={speak}
          onPlayAgain={start}
          onMenu={() => setScreen("menu")}
        />
      </main>
    );
  }

  return (
    <main className="flex-1">
      <Menu
        progress={progress}
        level={level}
        mode={effectiveMode}
        listenSupported={listenSupported}
        onLevelChange={setChosenLevel}
        onModeChange={setMode}
        onStart={start}
        onReset={reset}
      />
    </main>
  );
}
