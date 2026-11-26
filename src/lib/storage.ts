import type { CharStat } from "./curriculum";

const KEY = "hangul-blaster:v2";

export interface DailyStreak {
  /** Consecutive calendar days with at least one run finished. */
  days: number;
  /** The longest run of days so far. */
  best: number;
  /** Local calendar date of the last finished run, as YYYY-MM-DD. */
  lastPlayed: string | null;
}

export interface Progress {
  highScore: number;
  bestWave: number;
  /** Per-letter accuracy. Syllables are not tracked: they are built from these. */
  stats: Record<string, CharStat>;
  streak: DailyStreak;
}

export const EMPTY_PROGRESS: Progress = {
  highScore: 0,
  bestWave: 0,
  stats: {},
  streak: { days: 0, best: 0, lastPlayed: null },
};

/** Local calendar date, not UTC — the streak should turn over at your midnight. */
export function today(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayBefore(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const previous = new Date(year, month - 1, day - 1);
  return today(previous);
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const streak: Partial<DailyStreak> = parsed.streak ?? {};
    return {
      highScore: Number(parsed.highScore) || 0,
      bestWave: Number(parsed.bestWave) || 0,
      stats:
        parsed.stats && typeof parsed.stats === "object" ? parsed.stats : {},
      streak: {
        days: Number(streak.days) || 0,
        best: Number(streak.best) || 0,
        lastPlayed:
          typeof streak.lastPlayed === "string" ? streak.lastPlayed : null,
      },
    };
  } catch {
    // Private browsing, cleared site data, or corrupt JSON: start fresh.
    return EMPTY_PROGRESS;
  }
}

function saveProgress(progress: Progress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable — the game still plays, it just won't remember.
  }
}

/**
 * The streak as it stands *right now*, which is not always what is stored: a
 * streak you earned yesterday is still alive today and still shown, but it
 * breaks the moment a whole day is skipped.
 */
export function currentStreak(streak: DailyStreak, date?: string): number {
  // The clock is only read once there is something to compare against, so a
  // prerender of the empty state never touches Date.
  if (!streak.lastPlayed) return 0;
  const day = date ?? today();
  if (streak.lastPlayed === day || streak.lastPlayed === dayBefore(day)) {
    return streak.days;
  }
  return 0;
}

function advanceStreak(streak: DailyStreak, date: string): DailyStreak {
  if (streak.lastPlayed === date) return streak;
  const days = streak.lastPlayed === dayBefore(date) ? streak.days + 1 : 1;
  return { days, best: Math.max(streak.best, days), lastPlayed: date };
}

export interface RunSummary {
  score: number;
  wave: number;
  /** Letters struck and letters fumbled, in the order they were met. */
  results: Array<{ jamo: string; hit: boolean }>;
  /** Distinct targets that got through, for the review list. */
  missed: Array<{ char: string; jamo: string[] }>;
  keystrokes: number;
  misfires: number;
}

export function mergeStats(
  base: Record<string, CharStat>,
  results: Array<{ jamo: string; hit: boolean }>,
): Record<string, CharStat> {
  const out: Record<string, CharStat> = { ...base };
  for (const { jamo, hit } of results) {
    const prev = out[jamo] ?? { seen: 0, hit: 0 };
    out[jamo] = { seen: prev.seen + 1, hit: prev.hit + (hit ? 1 : 0) };
  }
  return out;
}

export function applyRun(
  progress: Progress,
  run: RunSummary,
  date = today(),
): Progress {
  return {
    highScore: Math.max(progress.highScore, run.score),
    bestWave: Math.max(progress.bestWave, run.wave),
    stats: mergeStats(progress.stats, run.results),
    streak: advanceStreak(progress.streak, date),
  };
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

export function commitProgress(next: Progress): void {
  cached = next;
  saveProgress(next);
  for (const listener of listeners) listener();
}

export function resetProgress(): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* nothing to do */
    }
  }
  cached = EMPTY_PROGRESS;
  for (const listener of listeners) listener();
}
