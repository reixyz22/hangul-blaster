/**
 * The letter inventory, for the reference page.
 *
 * There is no romanization here on purpose. A letter is learned as a shape, a
 * sound and a key — three things the game can actually test — and a Latin
 * gloss like "g / k" trains a lookup table instead of reading. The only Latin
 * on the reference page is keycaps, which are positions on a keyboard rather
 * than a pronunciation.
 */

export interface Letter {
  char: string;
  kind: "consonant" | "vowel";
  /** The Korean name of the letter. Vowels are named after themselves. */
  name: string;
  group: string;
}

export const LETTERS: Letter[] = [
  { char: "ㄱ", kind: "consonant", name: "기역", group: "기본 자음" },
  { char: "ㄴ", kind: "consonant", name: "니은", group: "기본 자음" },
  { char: "ㄷ", kind: "consonant", name: "디귿", group: "기본 자음" },
  { char: "ㄹ", kind: "consonant", name: "리을", group: "기본 자음" },
  { char: "ㅁ", kind: "consonant", name: "미음", group: "기본 자음" },
  { char: "ㅂ", kind: "consonant", name: "비읍", group: "기본 자음" },
  { char: "ㅅ", kind: "consonant", name: "시옷", group: "기본 자음" },
  { char: "ㅇ", kind: "consonant", name: "이응", group: "기본 자음" },
  { char: "ㅈ", kind: "consonant", name: "지읒", group: "기본 자음" },
  { char: "ㅎ", kind: "consonant", name: "히읗", group: "기본 자음" },

  { char: "ㅋ", kind: "consonant", name: "키읔", group: "거센소리" },
  { char: "ㅌ", kind: "consonant", name: "티읕", group: "거센소리" },
  { char: "ㅍ", kind: "consonant", name: "피읖", group: "거센소리" },
  { char: "ㅊ", kind: "consonant", name: "치읓", group: "거센소리" },

  { char: "ㄲ", kind: "consonant", name: "쌍기역", group: "된소리" },
  { char: "ㄸ", kind: "consonant", name: "쌍디귿", group: "된소리" },
  { char: "ㅃ", kind: "consonant", name: "쌍비읍", group: "된소리" },
  { char: "ㅆ", kind: "consonant", name: "쌍시옷", group: "된소리" },
  { char: "ㅉ", kind: "consonant", name: "쌍지읒", group: "된소리" },

  { char: "ㅏ", kind: "vowel", name: "아", group: "기본 모음" },
  { char: "ㅓ", kind: "vowel", name: "어", group: "기본 모음" },
  { char: "ㅗ", kind: "vowel", name: "오", group: "기본 모음" },
  { char: "ㅜ", kind: "vowel", name: "우", group: "기본 모음" },
  { char: "ㅡ", kind: "vowel", name: "으", group: "기본 모음" },
  { char: "ㅣ", kind: "vowel", name: "이", group: "기본 모음" },

  { char: "ㅑ", kind: "vowel", name: "야", group: "이중 모음" },
  { char: "ㅕ", kind: "vowel", name: "여", group: "이중 모음" },
  { char: "ㅛ", kind: "vowel", name: "요", group: "이중 모음" },
  { char: "ㅠ", kind: "vowel", name: "유", group: "이중 모음" },

  { char: "ㅐ", kind: "vowel", name: "애", group: "합성 모음" },
  { char: "ㅔ", kind: "vowel", name: "에", group: "합성 모음" },
  { char: "ㅒ", kind: "vowel", name: "얘", group: "합성 모음" },
  { char: "ㅖ", kind: "vowel", name: "예", group: "합성 모음" },
  { char: "ㅘ", kind: "vowel", name: "와", group: "합성 모음" },
  { char: "ㅙ", kind: "vowel", name: "왜", group: "합성 모음" },
  { char: "ㅚ", kind: "vowel", name: "외", group: "합성 모음" },
  { char: "ㅝ", kind: "vowel", name: "워", group: "합성 모음" },
  { char: "ㅞ", kind: "vowel", name: "웨", group: "합성 모음" },
  { char: "ㅟ", kind: "vowel", name: "위", group: "합성 모음" },
  { char: "ㅢ", kind: "vowel", name: "의", group: "합성 모음" },
];

export const GROUPS = [
  "기본 자음",
  "기본 모음",
  "이중 모음",
  "거센소리",
  "된소리",
  "합성 모음",
] as const;
