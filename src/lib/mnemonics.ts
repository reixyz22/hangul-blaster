/**
 * One Korean word per letter, in the style of a 가나다 children's book — the
 * Korean "A is for apple".
 *
 * A thing worth knowing if you edit this: **no Korean word begins with a bare
 * vowel.** A word that sounds like it starts with ㅏ is spelled with ㅇ in
 * front of it — 아기, not *ㅏ기. So the vowel cards all start with 아/어/오/우,
 * and that is a feature: the single rule beginners trip over is that initial ㅇ
 * is silent, and these cards teach it before anyone has to be told.
 *
 * `gloss` is a placeholder for the picture that will replace it. It is the one
 * piece of English anywhere in the game, it appears only on the card that
 * introduces a letter, and it goes away the moment there is art.
 */

export interface Mnemonic {
  /** The Korean word. */
  word: string;
  /** What it means — stands in for the picture, not shown during play. */
  gloss: string;
}

export const MNEMONICS: Readonly<Record<string, Mnemonic>> = {
  // Consonants: the word starts with the letter.
  "ㄱ": { word: "기차", gloss: "train" },
  "ㄴ": { word: "나비", gloss: "butterfly" },
  "ㄷ": { word: "돼지", gloss: "pig" },
  "ㄹ": { word: "라디오", gloss: "radio" },
  "ㅁ": { word: "모자", gloss: "hat" },
  "ㅂ": { word: "바나나", gloss: "banana" },
  "ㅅ": { word: "사과", gloss: "apple" },
  "ㅇ": { word: "오리", gloss: "duck" },
  "ㅈ": { word: "자동차", gloss: "car" },
  "ㅎ": { word: "호랑이", gloss: "tiger" },
  "ㅋ": { word: "코끼리", gloss: "elephant" },
  "ㅌ": { word: "토끼", gloss: "rabbit" },
  "ㅍ": { word: "포도", gloss: "grapes" },
  "ㅊ": { word: "책", gloss: "book" },
  "ㄲ": { word: "꽃", gloss: "flower" },
  "ㄸ": { word: "딸기", gloss: "strawberry" },
  "ㅃ": { word: "빵", gloss: "bread" },
  "ㅆ": { word: "쌀", gloss: "rice" },
  "ㅉ": { word: "찌개", gloss: "stew" },

  // Vowels: the word starts with silent ㅇ plus the letter.
  "ㅏ": { word: "아기", gloss: "baby" },
  "ㅓ": { word: "어머니", gloss: "mother" },
  "ㅗ": { word: "오이", gloss: "cucumber" },
  "ㅜ": { word: "우산", gloss: "umbrella" },
  "ㅡ": { word: "음식", gloss: "food" },
  "ㅣ": { word: "이불", gloss: "blanket" },
  "ㅑ": { word: "야구", gloss: "baseball" },
  "ㅕ": { word: "여우", gloss: "fox" },
  "ㅛ": { word: "요리", gloss: "cooking" },
  "ㅠ": { word: "유리", gloss: "glass" },
  "ㅐ": { word: "애벌레", gloss: "caterpillar" },
  "ㅔ": { word: "에어컨", gloss: "air conditioner" },
  "ㅒ": { word: "얘기", gloss: "a talk" },
  "ㅖ": { word: "예술", gloss: "art" },
  "ㅘ": { word: "왕", gloss: "king" },
  "ㅙ": { word: "왜가리", gloss: "heron" },
  "ㅚ": { word: "외투", gloss: "coat" },
  "ㅝ": { word: "원숭이", gloss: "monkey" },
  "ㅞ": { word: "웨딩", gloss: "wedding" },
  "ㅟ": { word: "위", gloss: "the top" },
  "ㅢ": { word: "의자", gloss: "chair" },
};

export function mnemonicFor(jamo: string): Mnemonic | null {
  return MNEMONICS[jamo] ?? null;
}
