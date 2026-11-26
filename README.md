# Hangul Blaster

A typing shooter for the Korean alphabet. Meteors fall, you type what's on
them, your ship fires. Type 각 and that's three keystrokes — `r k r` — and the
meteor cracks apart one letter at a time.

No backend, no accounts, no menu. Progress lives in `localStorage`.

## There is no romanization in this game

Not on the meteors, not on the buttons, not on the reference page. A letter is
learned here as a **shape**, a **sound** and a **key** — three things the game
can actually test. "ㄱ = g/k" trains a Latin lookup table instead of reading.

That isn't settled science, and it would be dishonest to pretend otherwise: no
controlled study compares romanization-supported and Hangul-only learners of
Korean. What exists is adjacent and suggestive —

- L1 orthographic interference is robust in L2 word learning, and worst where
  grapheme-phoneme correspondences are incongruent between the two systems,
  which is exactly ㄱ → "g/k".
- [Pae, Lee & Yi (2025)](https://link.springer.com/article/10.1186/s40862-025-00348-7)
  taught 34 English-speaking adults Hangul two ways. The grapheme-emphasis
  group won the *grapheme-matching* test and nothing else. **You get good at
  what you train.**

The only Latin letters anywhere are keycaps, which are positions on a keyboard
rather than pronunciations.

## Syllables early, on purpose

That same 2025 study found the **syllable**-emphasis group read both trained
and novel words more accurately, on both test days. An earlier study by the
same group comparing large-, medium- and small-grain instruction put the
syllable group on top too.

So bare letters are an on-ramp, not the game. ㅏ and ㄱ arrive in the first two
waves and 가 falls in the third. After that most meteors are syllable blocks.

The typing mechanic is what makes this free: a block on screen is one syllable,
and under your fingers it is its letters in order. Both grain sizes, one
action.

## Playing

Press 시작 and you're in. There is no difficulty setting because the weighting
*is* the difficulty — letters you own fall fast and score more, letters you
fumble fall slow and come back sooner.

- **Desktop** — just type. The game reads physical keys itself, so no Korean
  IME and no setup: `r` is ㄱ whatever your keycaps say. If you *do* have an
  IME running, composed jamo are accepted too.
- **Phone** — the on-screen keyboard is the real dubeolsik layout, so the thumb
  that learns where ㄱ lives is teaching the finger that will reach for `r`.

Layout is dubeolsik (두벌식), [KS X 5002](https://en.wikipedia.org/wiki/Korean_language_and_computers),
the South Korean standard since 1985 and the default on Windows, macOS,
Android and iOS. Consonants left hand, vowels right.

## What makes it a game and not flash cards

- **Multi-keystroke targets.** Progress is visible mid-target — the letters
  under a block light up as they land.
- **Lock-on.** The first letter you type commits you to that meteor. A wrong
  letter breaks the lock and the meteor knits itself back together, so a miss
  costs progress rather than a life.
- **Several at once.** Which one you engage is a real decision.
- **Waves.** Each one introduces a letter on a card with its 가나다 mnemonic
  word, then mixes it into everything already learned.
- **Silent meteors.** From wave 5, some arrive showing nothing at all — the
  sound is the only clue. Worth double.
- **A daily streak** on the local calendar day, which survives a missed hour
  but not a missed day.

## The mnemonic words

Every letter carries a word in the style of a 가나다 children's book — ㄱ is
기차, ㄴ is 나비, ㅅ is 사과.

The vowels work differently and the difference is the lesson: **no Korean word
begins with a bare vowel.** A word that sounds like it starts with ㅏ is spelled
with a silent ㅇ in front — 아기, 오이, 우산. The one rule beginners trip over
is taught by the cards before anyone has to state it.

`gloss` in [`src/lib/mnemonics.ts`](src/lib/mnemonics.ts) is a placeholder for
the picture that will replace it. It is the only English in the app, it appears
only on the card that introduces a letter, and it goes away once there is art.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build
npm start
```

`npm run lint` runs ESLint; `npx tsc --noEmit` typechecks.

## Deploying

Vercel, stock Next.js settings, nothing to configure. Import the repository,
leave every default alone, deploy.

## Notes on the build

- **No Korean webfont.** The game composes syllables at runtime, so its glyph
  set is most of the 11,172 modern blocks — far past what a subset can carry,
  and the full Noto Sans KR is ~450 KB of split chunks behind a render-blocking
  stylesheet. Every platform this runs on ships a Korean face, so `--font-ko`
  asks for those: nothing to download, nothing missing.
- **The reference page doesn't hydrate.** `/chart` is a server component of
  static HTML with the syllable to speak in a `data-speak` attribute; one
  client island delegates a single click listener for all 94 buttons.
  Hydrating them as React components cost 2.3 s of blocked main thread on a
  mid-range phone.
- **Motion is written straight to the DOM.** Meteor positions, ship rotation
  and the beam are set on nodes inside one `requestAnimationFrame`, so a 60fps
  field never costs a React render. React state changes only on spawn, strike
  and destroy.
- `prefers-reduced-motion` turns the fall into ten discrete hops and gives
  every target 30% longer.

## Ideas for v2

Picture meteors for the mnemonic words, replacing the English glosses.
Accounts and cross-device sync, leaderboards, multiplayer races, recorded
native-speaker audio in place of speech synthesis, whole-word and sentence
waves, and the batchim liaison rules that single syllables let us dodge.
