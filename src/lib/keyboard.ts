/**
 * The Korean keyboard, and how a syllable breaks into keystrokes.
 *
 * The game reads physical keys itself rather than asking anyone to switch on a
 * Korean IME: a `KeyboardEvent` carries `code` ("KeyR"), which is the physical
 * key whatever layout the OS has loaded, so `r` is ㄱ here no matter what the
 * keycaps say. If a Korean IME *is* on, `key` arrives as a jamo already and we
 * take that instead.
 *
 * Layout is dubeolsik (두벌식), KS X 5002 — the South Korean standard since
 * 1985 and the default on Windows, macOS, Android and iOS. Consonants sit
 * under the left hand, vowels under the right.
 */

/** Jamo reachable with one key. Capitals mean that key with shift held. */
export const KEY_TO_JAMO: Readonly<Record<string, string>> = {
  // Consonants, left hand.
  q: "ㅂ", w: "ㅈ", e: "ㄷ", r: "ㄱ", t: "ㅅ",
  a: "ㅁ", s: "ㄴ", d: "ㅇ", f: "ㄹ", g: "ㅎ",
  z: "ㅋ", x: "ㅌ", c: "ㅊ", v: "ㅍ",
  // Tense consonants, shifted.
  Q: "ㅃ", W: "ㅉ", E: "ㄸ", R: "ㄲ", T: "ㅆ",
  // Vowels, right hand.
  y: "ㅛ", u: "ㅕ", i: "ㅑ", o: "ㅐ", p: "ㅔ",
  h: "ㅗ", j: "ㅓ", k: "ㅏ", l: "ㅣ",
  b: "ㅠ", n: "ㅜ", m: "ㅡ",
  O: "ㅒ", P: "ㅖ",
};

export const JAMO_TO_KEY: ReadonlyMap<string, string> = new Map(
  Object.entries(KEY_TO_JAMO).map(([key, jamo]) => [jamo, key]),
);

/**
 * Compound vowels have no key of their own — they are typed as the two vowels
 * they are drawn from, which is also how they are taught.
 */
const COMPOUND_VOWELS: Readonly<Record<string, string>> = {
  "ㅘ": "ㅗㅏ",
  "ㅙ": "ㅗㅐ",
  "ㅚ": "ㅗㅣ",
  "ㅝ": "ㅜㅓ",
  "ㅞ": "ㅜㅔ",
  "ㅟ": "ㅜㅣ",
  "ㅢ": "ㅡㅣ",
};

/** The keys that produce one jamo, in order. "ㅘ" -> "hk". */
export function keysForJamo(jamo: string): string {
  const compound = COMPOUND_VOWELS[jamo];
  if (compound) {
    return [...compound].map((part) => keysForJamo(part)).join("");
  }
  const key = JAMO_TO_KEY.get(jamo);
  if (!key) throw new Error(`No dubeolsik key for ${jamo}`);
  return key;
}

/** How the key is printed on a US keycap, e.g. "R" or "⇧R". */
export function keyCapFor(jamo: string): string {
  return [...keysForJamo(jamo)]
    .map((key) => (key === key.toUpperCase() ? "⇧" + key : key.toUpperCase()))
    .join(" ");
}

// ── Syllable blocks ─────────────────────────────────────────────────────────

const INITIALS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ".split("");
const VOWELS = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ".split("");
const FINALS = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ",
  "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ",
  "ㅌ", "ㅍ", "ㅎ",
];

const SYLLABLE_BASE = 0xac00;
const SYLLABLE_COUNT = 11172;

export function isSyllable(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return code >= SYLLABLE_BASE && code < SYLLABLE_BASE + SYLLABLE_COUNT;
}

export function compose(initial: string, vowel: string, final = ""): string {
  const i = INITIALS.indexOf(initial);
  const v = VOWELS.indexOf(vowel);
  const f = FINALS.indexOf(final);
  if (i < 0 || v < 0 || f < 0) {
    throw new Error(`Cannot compose ${initial}${vowel}${final}`);
  }
  return String.fromCodePoint(SYLLABLE_BASE + (i * 21 + v) * 28 + f);
}

/** "각" -> ["ㄱ", "ㅏ", "ㄱ"]. A bare jamo returns itself. */
export function decompose(char: string): string[] {
  if (!isSyllable(char)) return [char];
  const offset = (char.codePointAt(0) ?? 0) - SYLLABLE_BASE;
  const final = FINALS[offset % 28];
  const vowel = VOWELS[Math.floor(offset / 28) % 21];
  const initial = INITIALS[Math.floor(offset / 28 / 21)];
  return final ? [initial, vowel, final] : [initial, vowel];
}

/**
 * Rebuild a syllable from however many jamo have been typed so far, so a
 * target can assemble itself on screen as it is struck: ㄱ, 가, 각.
 */
export function partial(jamo: string[]): string {
  if (jamo.length === 0) return "";
  if (jamo.length === 1) return jamo[0];
  const [initial, vowel, final] = jamo;
  if (INITIALS.indexOf(initial) < 0 || VOWELS.indexOf(vowel) < 0) {
    return jamo.join("");
  }
  return compose(initial, vowel, final ?? "");
}

/** The full keystroke sequence for a target, e.g. "각" -> "rkr". */
export function keysForTarget(char: string): string {
  return decompose(char).map(keysForJamo).join("");
}

/**
 * Turn a keydown into the jamo it produces, or null.
 *
 * `code` is used rather than `key` so the mapping holds whatever layout the OS
 * has active — except when a Korean IME is already running, in which case the
 * jamo arrives in `key` and we use it as-is.
 */
export function jamoFromEvent(event: {
  key: string;
  code: string;
  shiftKey: boolean;
}): string | null {
  if (JAMO_TO_KEY.has(event.key)) return event.key;

  const match = /^Key([A-Z])$/.exec(event.code);
  if (!match) return null;
  const letter = match[1];
  const key = event.shiftKey ? letter : letter.toLowerCase();
  return KEY_TO_JAMO[key] ?? null;
}
