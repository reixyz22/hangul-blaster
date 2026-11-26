import { JAMO, jamo, type Jamo } from "./hangul";

/** One thing that can fall down the screen and be answered. */
export interface Card {
  /** Stable key used for per-character stats in localStorage. */
  id: string;
  /** The glyph shown to the player. */
  char: string;
  /** Revised Romanization — the correct answer. */
  rom: string;
  /** Text handed to speech synthesis. */
  speak: string;
  /** Jamo this card is built from. Single-letter cards have one entry. */
  parts: string[];
}

export interface Level {
  id: number;
  name: string;
  blurb: string;
}

export const LEVELS: Level[] = [
  { id: 1, name: "Basic consonants", blurb: "ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅎ" },
  { id: 2, name: "Basic vowels", blurb: "ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ" },
  { id: 3, name: "Y-vowels", blurb: "ㅑ ㅕ ㅛ ㅠ" },
  { id: 4, name: "Aspirated & tense", blurb: "ㅋ ㅌ ㅍ ㅊ ㄲ ㄸ ㅃ ㅆ ㅉ" },
  { id: 5, name: "Compound vowels", blurb: "ㅐ ㅔ ㅒ ㅖ ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ" },
  { id: 6, name: "Syllable blocks", blurb: "가 나 도 무 · 각 반 돌 …" },
];

export const LAST_LEVEL = LEVELS[LEVELS.length - 1].id;

// ── Syllable composition ────────────────────────────────────────────────────
// A Hangul syllable block is a single code point:
//   U+AC00 + (initial * 21 + vowel) * 28 + final

const INITIALS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ".split("");
const VOWELS = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ".split("");
const FINALS = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ",
  "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ",
  "ㅌ", "ㅍ", "ㅎ",
];

export function compose(initial: string, vowel: string, final = ""): string {
  const i = INITIALS.indexOf(initial);
  const v = VOWELS.indexOf(vowel);
  const f = FINALS.indexOf(final);
  if (i < 0 || v < 0 || f < 0) {
    throw new Error(`Cannot compose ${initial}${vowel}${final}`);
  }
  return String.fromCodePoint(0xac00 + (i * 21 + v) * 28 + f);
}

function syllableCard(initial: string, vowel: string, final = ""): Card {
  const char = compose(initial, vowel, final);
  const rom =
    jamo(initial).initial +
    jamo(vowel).initial +
    (final ? jamo(final).final : "");
  return {
    id: char,
    char,
    rom,
    speak: char,
    parts: final ? [initial, vowel, final] : [initial, vowel],
  };
}

function jamoCard(j: Jamo): Card {
  return { id: j.char, char: j.char, rom: j.rom, speak: j.speak, parts: [j.char] };
}

// Level 6 is generated rather than listed: a consonant-vowel set first, then
// the same blocks with a final consonant (batchim). Finals are limited to the
// six that romanize unambiguously, so no two cards ever share an answer.
const SYLLABLE_INITIALS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅈ", "ㅎ"];
const SYLLABLE_VOWELS = ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"];
const BATCHIM_INITIALS = ["ㄱ", "ㄴ", "ㄷ", "ㅁ", "ㅂ", "ㅅ"];
const BATCHIM_VOWELS = ["ㅏ", "ㅓ", "ㅗ"];
const BATCHIM_FINALS = ["ㄱ", "ㄴ", "ㄹ", "ㅁ", "ㅂ", "ㅇ"];

function syllablePool(): Card[] {
  const cards: Card[] = [];
  for (const c of SYLLABLE_INITIALS) {
    for (const v of SYLLABLE_VOWELS) cards.push(syllableCard(c, v));
  }
  for (const c of BATCHIM_INITIALS) {
    for (const v of BATCHIM_VOWELS) {
      for (const f of BATCHIM_FINALS) cards.push(syllableCard(c, v, f));
    }
  }
  return cards;
}

const POOLS: ReadonlyMap<number, Card[]> = new Map(
  LEVELS.map((lvl) => [
    lvl.id,
    lvl.id === LAST_LEVEL
      ? syllablePool()
      : JAMO.filter((j) => j.level === lvl.id).map(jamoCard),
  ]),
);

export function poolFor(levelId: number): Card[] {
  return POOLS.get(levelId) ?? [];
}

export function levelName(levelId: number): string {
  return LEVELS.find((l) => l.id === levelId)?.name ?? `Level ${levelId}`;
}

/**
 * Cards a learner genuinely mixes up with this one — used for distractors.
 * Single letters use the hand-curated confusable sets; syllable blocks use
 * neighbours that differ by exactly one jamo, which is the real failure mode.
 */
export function confusablesFor(card: Card, pool: Card[]): Card[] {
  if (card.parts.length === 1) {
    const set = new Set(jamo(card.char).confusables);
    const all = JAMO.filter((j) => set.has(j.char)).map(jamoCard);
    return all;
  }
  const [i, v, f] = card.parts;
  return pool.filter((other) => {
    if (other.id === card.id) return false;
    if (other.parts.length !== card.parts.length) return false;
    const [oi, ov, of_] = other.parts;
    let diff = 0;
    if (oi !== i) diff++;
    if (ov !== v) diff++;
    if ((of_ ?? "") !== (f ?? "")) diff++;
    return diff === 1;
  });
}
