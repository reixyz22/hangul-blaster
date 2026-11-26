import { LAST_LEVEL } from "./levels";

const KEY = "hangul-blaster:v1";

export interface CharStat {
  seen: number;
  correct: number;
}

export interface Progress {
  highScore: number;
  bestStreak: number;
  /** Highest level the player has earned. Every level stays playable. */
  unlockedLevel: number;
  /** Per-character accuracy, keyed by Card.id. Drives weighted repetition. */
  stats: Record<string, CharStat>;
}

export const EMPTY_PROGRESS: Progress = {
  highScore: 0,
  bestStreak: 0,
  unlockedLevel: 1,
  stats: {},
};

/** Correct answers needed in a single run to unlock the next level. */
export const UNLOCK_THRESHOLD = 10;

export function loadProgress(): Progress {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      highScore: Number(parsed.highScore) || 0,
      bestStreak: Number(parsed.bestStreak) || 0,
      unlockedLevel: Math.min(
        Math.max(Number(parsed.unlockedLevel) || 1, 1),
        LAST_LEVEL,
      ),
      stats:
        parsed.stats && typeof parsed.stats === "object" ? parsed.stats : {},
    };
  } catch {
    // Private browsing, cleared site data, or corrupt JSON: start fresh.
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(progress: Progress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable — the game still plays, it just won't remember.
  }
}

export function clearProgress(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

export function accuracyOf(stat: CharStat | undefined): number | null {
  if (!stat || stat.seen === 0) return null;
  return stat.correct / stat.seen;
}

/** Fold one run's results into stored progress. Pure: returns a new object. */
export function applyRun(
  progress: Progress,
  run: {
    score: number;
    bestStreak: number;
    level: number;
    correctCount: number;
    results: Array<{ id: string; correct: boolean }>;
  },
): Progress {
  const stats: Record<string, CharStat> = { ...progress.stats };
  for (const { id, correct } of run.results) {
    const prev = stats[id] ?? { seen: 0, correct: 0 };
    stats[id] = {
      seen: prev.seen + 1,
      correct: prev.correct + (correct ? 1 : 0),
    };
  }
  const earned =
    run.correctCount >= UNLOCK_THRESHOLD && run.level >= progress.unlockedLevel
      ? Math.min(run.level + 1, LAST_LEVEL)
      : progress.unlockedLevel;

  return {
    highScore: Math.max(progress.highScore, run.score),
    bestStreak: Math.max(progress.bestStreak, run.bestStreak),
    unlockedLevel: earned,
    stats,
  };
}

/** Stored stats plus the results of the run in progress, for live weighting. */
export function mergeStats(
  base: Record<string, CharStat>,
  results: Array<{ id: string; correct: boolean }>,
): Record<string, CharStat> {
  const out: Record<string, CharStat> = { ...base };
  for (const { id, correct } of results) {
    const prev = out[id] ?? { seen: 0, correct: 0 };
    out[id] = { seen: prev.seen + 1, correct: prev.correct + (correct ? 1 : 0) };
  }
  return out;
}

// ── Progress as an external store ───────────────────────────────────────────
// Read through useSyncExternalStore so React renders the server's empty
// progress, then swaps in what localStorage holds without a setState-in-effect.

let cached: Progress | null = null;
const listeners = new Set<() => void>();

export function subscribeProgress(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function progressSnapshot(): Progress {
  if (cached === null) cached = loadProgress();
  return cached;
}

export function serverProgressSnapshot(): Progress {
  return EMPTY_PROGRESS;
}

/** Write progress to storage and tell every subscriber. */
export function commitProgress(next: Progress): void {
  cached = next;
  saveProgress(next);
  for (const listener of listeners) listener();
}

export function resetProgress(): void {
  clearProgress();
  cached = EMPTY_PROGRESS;
  for (const listener of listeners) listener();
}
