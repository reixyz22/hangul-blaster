import type { Card } from "./levels";
import type { Mode } from "./quiz";

export interface RunSummary {
  level: number;
  mode: Mode;
  score: number;
  bestStreak: number;
  correctCount: number;
  results: Array<{ id: string; correct: boolean }>;
  /** Distinct cards the player got wrong or let fall, for the review list. */
  missed: Card[];
}
