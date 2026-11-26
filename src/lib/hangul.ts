/**
 * Hangul data.
 *
 * `rom` is the answer label shown to the player, in Revised Romanization.
 * Letters whose sound depends on position (e.g. ㄱ) carry a single combined
 * label ("g / k") so the player is never asked to guess which one we meant.
 *
 * `initial` / `final` are the romanizations used when a consonant is built
 * into a syllable block (level 6). `speak` is the syllable handed to speech
 * synthesis: a bare jamo is read aloud as its letter *name* ("기역") by a
 * Korean voice, which is not what we want to teach, so consonants are spoken
 * as their ㅏ-syllable (가, 나, 다 …) and vowels as their ㅇ-syllable (아, 어 …).
 */

export type JamoType = "consonant" | "vowel";

export interface Jamo {
  char: string;
  rom: string;
  type: JamoType;
  /** Romanization in syllable-initial position. "" for silent ㅇ. */
  initial: string;
  /** Romanization as a final consonant (batchim). Null if never used as one here. */
  final: string | null;
  /** Syllable spoken by speech synthesis to demonstrate the sound. */
  speak: string;
  /** Korean name of the letter, shown on the reference chart. */
  name: string;
  level: number;
  /** Letters this one is genuinely confused with, by shape or by sound. */
  confusables: string[];
}

export const JAMO: Jamo[] = [
  // ── Level 1 · basic consonants ────────────────────────────────────────────
  { char: "ㄱ", rom: "g / k",      type: "consonant", initial: "g",  final: "k",  speak: "가", name: "기역",   level: 1, confusables: ["ㅋ", "ㄲ", "ㄴ", "ㅈ"] },
  { char: "ㄴ", rom: "n",          type: "consonant", initial: "n",  final: "n",  speak: "나", name: "니은",   level: 1, confusables: ["ㄱ", "ㄹ", "ㄷ"] },
  { char: "ㄷ", rom: "d / t",      type: "consonant", initial: "d",  final: "t",  speak: "다", name: "디귿",   level: 1, confusables: ["ㅌ", "ㄸ", "ㄹ", "ㅁ"] },
  { char: "ㄹ", rom: "r / l",      type: "consonant", initial: "r",  final: "l",  speak: "라", name: "리을",   level: 1, confusables: ["ㄷ", "ㄴ", "ㅌ"] },
  { char: "ㅁ", rom: "m",          type: "consonant", initial: "m",  final: "m",  speak: "마", name: "미음",   level: 1, confusables: ["ㅂ", "ㅍ", "ㅇ"] },
  { char: "ㅂ", rom: "b / p",      type: "consonant", initial: "b",  final: "p",  speak: "바", name: "비읍",   level: 1, confusables: ["ㅁ", "ㅍ", "ㅃ"] },
  { char: "ㅅ", rom: "s",          type: "consonant", initial: "s",  final: "t",  speak: "사", name: "시옷",   level: 1, confusables: ["ㅈ", "ㅊ", "ㅆ"] },
  { char: "ㅇ", rom: "ng / silent", type: "consonant", initial: "", final: "ng", speak: "아", name: "이응",   level: 1, confusables: ["ㅎ", "ㅁ"] },
  { char: "ㅈ", rom: "j",          type: "consonant", initial: "j",  final: "t",  speak: "자", name: "지읒",   level: 1, confusables: ["ㅊ", "ㅉ", "ㅅ", "ㄱ"] },
  { char: "ㅎ", rom: "h",          type: "consonant", initial: "h",  final: "t",  speak: "하", name: "히읗",   level: 1, confusables: ["ㅇ", "ㅈ"] },

  // ── Level 2 · basic vowels ────────────────────────────────────────────────
  { char: "ㅏ", rom: "a",  type: "vowel", initial: "a",  final: null, speak: "아", name: "ㅏ", level: 2, confusables: ["ㅓ", "ㅑ", "ㅐ"] },
  { char: "ㅓ", rom: "eo", type: "vowel", initial: "eo", final: null, speak: "어", name: "ㅓ", level: 2, confusables: ["ㅏ", "ㅕ", "ㅔ", "ㅗ"] },
  { char: "ㅗ", rom: "o",  type: "vowel", initial: "o",  final: null, speak: "오", name: "ㅗ", level: 2, confusables: ["ㅜ", "ㅛ", "ㅓ", "ㅡ"] },
  { char: "ㅜ", rom: "u",  type: "vowel", initial: "u",  final: null, speak: "우", name: "ㅜ", level: 2, confusables: ["ㅗ", "ㅠ", "ㅡ"] },
  { char: "ㅡ", rom: "eu", type: "vowel", initial: "eu", final: null, speak: "으", name: "ㅡ", level: 2, confusables: ["ㅜ", "ㅗ", "ㅣ"] },
  { char: "ㅣ", rom: "i",  type: "vowel", initial: "i",  final: null, speak: "이", name: "ㅣ", level: 2, confusables: ["ㅡ", "ㅏ", "ㅓ"] },

  // ── Level 3 · y-vowels ────────────────────────────────────────────────────
  { char: "ㅑ", rom: "ya",  type: "vowel", initial: "ya",  final: null, speak: "야", name: "ㅑ", level: 3, confusables: ["ㅏ", "ㅕ", "ㅛ"] },
  { char: "ㅕ", rom: "yeo", type: "vowel", initial: "yeo", final: null, speak: "여", name: "ㅕ", level: 3, confusables: ["ㅓ", "ㅑ", "ㅠ"] },
  { char: "ㅛ", rom: "yo",  type: "vowel", initial: "yo",  final: null, speak: "요", name: "ㅛ", level: 3, confusables: ["ㅗ", "ㅠ", "ㅑ"] },
  { char: "ㅠ", rom: "yu",  type: "vowel", initial: "yu",  final: null, speak: "유", name: "ㅠ", level: 3, confusables: ["ㅜ", "ㅛ", "ㅕ"] },

  // ── Level 4 · aspirated and tense consonants ──────────────────────────────
  { char: "ㅋ", rom: "k",  type: "consonant", initial: "k",  final: "k",  speak: "카", name: "키읔",   level: 4, confusables: ["ㄱ", "ㄲ", "ㅌ"] },
  { char: "ㅌ", rom: "t",  type: "consonant", initial: "t",  final: "t",  speak: "타", name: "티읕",   level: 4, confusables: ["ㄷ", "ㄸ", "ㅋ", "ㄹ"] },
  { char: "ㅍ", rom: "p",  type: "consonant", initial: "p",  final: "p",  speak: "파", name: "피읖",   level: 4, confusables: ["ㅂ", "ㅃ", "ㅁ"] },
  { char: "ㅊ", rom: "ch", type: "consonant", initial: "ch", final: "t",  speak: "차", name: "치읓",   level: 4, confusables: ["ㅈ", "ㅉ", "ㅅ"] },
  { char: "ㄲ", rom: "kk", type: "consonant", initial: "kk", final: "k",  speak: "까", name: "쌍기역", level: 4, confusables: ["ㄱ", "ㅋ"] },
  { char: "ㄸ", rom: "tt", type: "consonant", initial: "tt", final: null, speak: "따", name: "쌍디귿", level: 4, confusables: ["ㄷ", "ㅌ"] },
  { char: "ㅃ", rom: "pp", type: "consonant", initial: "pp", final: null, speak: "빠", name: "쌍비읍", level: 4, confusables: ["ㅂ", "ㅍ"] },
  { char: "ㅆ", rom: "ss", type: "consonant", initial: "ss", final: "t",  speak: "싸", name: "쌍시옷", level: 4, confusables: ["ㅅ", "ㅈ"] },
  { char: "ㅉ", rom: "jj", type: "consonant", initial: "jj", final: null, speak: "짜", name: "쌍지읒", level: 4, confusables: ["ㅈ", "ㅊ"] },

  // ── Level 5 · compound vowels ─────────────────────────────────────────────
  { char: "ㅐ", rom: "ae",  type: "vowel", initial: "ae",  final: null, speak: "애", name: "ㅐ", level: 5, confusables: ["ㅔ", "ㅒ", "ㅏ"] },
  { char: "ㅔ", rom: "e",   type: "vowel", initial: "e",   final: null, speak: "에", name: "ㅔ", level: 5, confusables: ["ㅐ", "ㅖ", "ㅓ"] },
  { char: "ㅒ", rom: "yae", type: "vowel", initial: "yae", final: null, speak: "얘", name: "ㅒ", level: 5, confusables: ["ㅖ", "ㅐ", "ㅑ"] },
  { char: "ㅖ", rom: "ye",  type: "vowel", initial: "ye",  final: null, speak: "예", name: "ㅖ", level: 5, confusables: ["ㅒ", "ㅔ", "ㅕ"] },
  { char: "ㅘ", rom: "wa",  type: "vowel", initial: "wa",  final: null, speak: "와", name: "ㅘ", level: 5, confusables: ["ㅙ", "ㅝ", "ㅚ"] },
  { char: "ㅙ", rom: "wae", type: "vowel", initial: "wae", final: null, speak: "왜", name: "ㅙ", level: 5, confusables: ["ㅘ", "ㅞ", "ㅚ"] },
  { char: "ㅚ", rom: "oe",  type: "vowel", initial: "oe",  final: null, speak: "외", name: "ㅚ", level: 5, confusables: ["ㅙ", "ㅘ", "ㅟ"] },
  { char: "ㅝ", rom: "wo",  type: "vowel", initial: "wo",  final: null, speak: "워", name: "ㅝ", level: 5, confusables: ["ㅞ", "ㅘ", "ㅜ"] },
  { char: "ㅞ", rom: "we",  type: "vowel", initial: "we",  final: null, speak: "웨", name: "ㅞ", level: 5, confusables: ["ㅝ", "ㅙ", "ㅚ"] },
  { char: "ㅟ", rom: "wi",  type: "vowel", initial: "wi",  final: null, speak: "위", name: "ㅟ", level: 5, confusables: ["ㅚ", "ㅝ", "ㅜ"] },
  { char: "ㅢ", rom: "ui",  type: "vowel", initial: "ui",  final: null, speak: "의", name: "ㅢ", level: 5, confusables: ["ㅡ", "ㅣ", "ㅚ"] },
];

export const JAMO_BY_CHAR: ReadonlyMap<string, Jamo> = new Map(
  JAMO.map((j) => [j.char, j]),
);

export function jamo(char: string): Jamo {
  const found = JAMO_BY_CHAR.get(char);
  if (!found) throw new Error(`Unknown jamo: ${char}`);
  return found;
}
