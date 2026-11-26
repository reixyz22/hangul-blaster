import { confusablesFor, type Card } from "./levels";
import type { CharStat } from "./storage";

export type Mode = "letter-to-sound" | "sound-to-letter" | "listen";

export const MODES: Array<{ id: Mode; name: string; blurb: string }> = [
  { id: "letter-to-sound", name: "Letter → sound", blurb: "See ㄱ, pick “g / k”" },
  { id: "sound-to-letter", name: "Sound → letter", blurb: "See “g / k”, pick ㄱ" },
  { id: "listen", name: "Listen", blurb: "Hear it, pick the letter" },
];

export const OPTION_COUNT = 4;

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * How badly this character needs practice.
 *
 * Never-seen characters sit above a well-known one but below a character the
 * player keeps missing, so a run introduces new material while still dragging
 * old mistakes back in front of them.
 */
export function weightOf(card: Card, stats: Record<string, CharStat>): number {
  const stat = stats[card.id];
  if (!stat || stat.seen === 0) return 2.5;
  const accuracy = stat.correct / stat.seen;
  return 1 + 4 * (1 - accuracy);
}

export function pickCard(
  pool: Card[],
  stats: Record<string, CharStat>,
  recentIds: string[],
): Card {
  // Don't repeat anything from the last few questions unless the pool is tiny.
  const avoid = new Set(recentIds.slice(-Math.min(3, pool.length - 1)));
  const candidates = pool.filter((c) => !avoid.has(c.id));
  const usable = candidates.length > 0 ? candidates : pool;

  const weights = usable.map((c) => weightOf(c, stats));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < usable.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return usable[i];
  }
  return usable[usable.length - 1];
}

export interface Question {
  card: Card;
  options: Card[];
  answerIndex: number;
}

/**
 * Build a question whose wrong answers are things the player might actually
 * believe: look-alikes and sound-alikes first, other letters from the level
 * only to fill the last slots.
 */
export function buildQuestion(
  card: Card,
  pool: Card[],
  mode: Mode,
): Question {
  // In "letter → sound" the buttons show romanizations, so two options that
  // romanize the same would make the question unanswerable.
  const keyOf = (c: Card) => (mode === "letter-to-sound" ? c.rom : c.char);

  const taken = new Set<string>([keyOf(card)]);
  const chosen: Card[] = [];

  const add = (candidates: Card[]) => {
    for (const c of shuffle(candidates)) {
      if (chosen.length >= OPTION_COUNT - 1) return;
      const key = keyOf(c);
      if (taken.has(key)) continue;
      taken.add(key);
      chosen.push(c);
    }
  };

  add(confusablesFor(card, pool));
  add(pool);

  const options = shuffle([card, ...chosen]);
  return { card, options, answerIndex: options.indexOf(card) };
}

/** Milliseconds a character takes to fall, tightening as the player scores. */
export function fallDurationMs(correctCount: number): number {
  return Math.max(1800, 6000 - correctCount * 160);
}

/** Points for a correct answer, with a streak bonus that caps at +100. */
export function pointsFor(streak: number): number {
  return 100 + 10 * Math.min(streak, 10);
}
