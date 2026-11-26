import {
  isSyllable,
  compose,
  decompose,
  keysForTarget,
} from "./keyboard";

/**
 * What falls, and when.
 *
 * The order below is not the usual 가나다 order. It is sequenced so that a
 * syllable block becomes possible as early as the third wave: ㅏ and ㄱ are
 * enough to build 가. Pae, Lee & Yi (2025) found that syllable-emphasis
 * instruction beat grapheme-emphasis instruction on reading both trained and
 * novel words, while grapheme instruction only won at matching graphemes — so
 * bare letters are an on-ramp here, not the game.
 *
 * Typing a block gives you both grain sizes at once: 각 is one syllable on
 * screen and three graphemes under your fingers.
 */
export const INTRO_ORDER: readonly string[] = [
  // Enough for 가 by wave 3.
  "ㅏ", "ㄱ", "ㄴ", "ㅣ", "ㅁ", "ㅗ", "ㄷ", "ㅓ", "ㅅ", "ㅜ",
  "ㅇ", "ㄹ", "ㅡ", "ㅂ", "ㅈ", "ㅎ",
  // Y-vowels.
  "ㅑ", "ㅕ", "ㅛ", "ㅠ",
  // Aspirated.
  "ㅋ", "ㅌ", "ㅍ", "ㅊ",
  // Compound vowels.
  "ㅐ", "ㅔ", "ㅚ", "ㅘ", "ㅝ", "ㅟ", "ㅢ", "ㅒ", "ㅖ", "ㅙ", "ㅞ",
  // Tense.
  "ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ",
];

const VOWEL_SET = new Set([
  "ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ", "ㅑ", "ㅕ", "ㅛ", "ㅠ",
  "ㅐ", "ㅔ", "ㅒ", "ㅖ", "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ",
]);

/** Finals limited to the six that are unambiguous and taught early. */
const USABLE_FINALS = ["ㄱ", "ㄴ", "ㄹ", "ㅁ", "ㅂ", "ㅇ"];

export function isVowel(jamo: string): boolean {
  return VOWEL_SET.has(jamo);
}

export interface Target {
  id: string;
  /** What is painted on the meteor: "ㄱ" or "각". */
  char: string;
  /** Its letters in order, which is also the order they are struck. */
  jamo: string[];
  /** The keystrokes that destroy it, e.g. "rkr". */
  keys: string;
  /** Audio-only: the meteor shows nothing and you type what you heard. */
  silent: boolean;
}

export interface CharStat {
  seen: number;
  hit: number;
}

export interface Wave {
  index: number;
  /** The letter this wave teaches, or null once the alphabet is spent. */
  introduces: string | null;
  targetCount: number;
  spawnGapMs: number;
}

/** Letters available on a given wave: everything introduced up to and including it. */
export function unlockedBy(waveIndex: number): string[] {
  return INTRO_ORDER.slice(0, Math.min(waveIndex, INTRO_ORDER.length));
}

export function waveFor(index: number): Wave {
  return {
    index,
    introduces: INTRO_ORDER[index - 1] ?? null,
    targetCount: Math.min(14, 4 + index),
    spawnGapMs: Math.max(1100, 2800 - index * 110),
  };
}

/** How badly a letter needs practice: 1 when owned, 5 when always missed. */
export function weightOf(jamo: string, stats: Record<string, CharStat>): number {
  const stat = stats[jamo];
  if (!stat || stat.seen === 0) return 2.5;
  return 1 + 4 * (1 - stat.hit / stat.seen);
}

function weightedPick(
  candidates: string[],
  stats: Record<string, CharStat>,
): string {
  const weights = candidates.map((c) => weightOf(c, stats));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

let nextId = 0;

function makeTarget(char: string, silent: boolean): Target {
  nextId += 1;
  return {
    id: `t${nextId}`,
    char,
    jamo: decompose(char),
    keys: keysForTarget(char),
    silent,
  };
}

/**
 * Build the next thing to shoot.
 *
 * Syllables take over as soon as there is a consonant and a vowel to build one
 * from, and the parts are drawn by weakness, so a letter you keep fumbling
 * comes back inside a block rather than being drilled on its own.
 */
export function nextTarget(
  waveIndex: number,
  stats: Record<string, CharStat>,
): Target {
  const unlocked = unlockedBy(waveIndex);
  const vowels = unlocked.filter(isVowel);
  const consonants = unlocked.filter((j) => !isVowel(j));

  const canBuildSyllable = vowels.length > 0 && consonants.length > 0;
  const syllableChance = Math.min(0.8, 0.25 + waveIndex * 0.08);
  const silent = waveIndex >= 5 && Math.random() < 0.18;

  if (!canBuildSyllable || Math.random() > syllableChance) {
    return makeTarget(weightedPick(unlocked, stats), silent);
  }

  const initial = weightedPick(consonants, stats);
  const vowel = weightedPick(vowels, stats);

  const finals = consonants.filter((c) => USABLE_FINALS.includes(c));
  const wantsFinal =
    waveIndex >= 8 && finals.length > 0 && Math.random() < 0.35;
  const final = wantsFinal ? weightedPick(finals, stats) : "";

  return makeTarget(compose(initial, vowel, final), silent);
}

/**
 * Seconds a target gets before it lands. Letters you own fall fast; letters
 * you are still learning fall slow. This is the whole difficulty system —
 * there is no difficulty setting, because the weighting is the setting.
 */
export function fallDurationMs(
  target: Target,
  waveIndex: number,
  stats: Record<string, CharStat>,
): number {
  const need =
    target.jamo.reduce((sum, j) => sum + weightOf(j, stats), 0) /
    target.jamo.length;
  // need runs 1 (mastered) to 5 (always missed).
  const comfort = 900 + (need - 1) * 700;
  const base = 4200 - waveIndex * 90;
  const perKey = 420 * target.keys.length;
  return Math.max(2200, Math.min(11000, base + comfort + perKey));
}

export function pointsFor(target: Target, streak: number): number {
  const base = 40 * target.keys.length;
  const bonus = target.silent ? 2 : 1;
  return Math.round(base * bonus * (1 + Math.min(streak, 12) * 0.1));
}

/**
 * What to hand speech synthesis for a target.
 *
 * A Korean voice reads a bare jamo as its *name* — ㄱ comes out "기역" — which
 * is not the sound being taught. So a lone consonant is spoken as its
 * ㅏ-syllable (가, 나, 다) and a lone vowel as its ㅇ-syllable (아, 어, 오),
 * which is both the sound and, for the vowels, a free lesson in silent ㅇ.
 * Syllable blocks speak themselves.
 */
export function speechFor(char: string): string {
  if (char.length !== 1 || isSyllable(char)) return char;
  return isVowel(char) ? compose("ㅇ", char) : compose(char, "ㅏ");
}
