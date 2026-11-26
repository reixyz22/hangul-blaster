# Hangul Blaster

An arcade game for learning the Korean alphabet. A character falls down the
screen; pick its match from four buttons before it lands. Speed climbs as you
score, you get three lives, and the characters you miss come back more often.

No backend, no accounts. Everything runs in the browser and progress lives in
`localStorage`.

## Playing

- **Letter → sound** — see ㄱ, pick "g / k"
- **Sound → letter** — see "g / k", pick ㄱ
- **Listen** — hear the sound, pick the letter (hidden on devices with no
  Korean voice installed)

Tap an answer, or press <kbd>1</kbd>–<kbd>4</kbd>.

Six levels, all playable from the start: basic consonants, basic vowels,
y-vowels, aspirated and tense consonants, compound vowels, and syllable blocks
(가 나 도 무 …, then blocks with a final consonant: 각 반 돌 …). Answer ten
correctly in a run to earn the next level.

## How it teaches

- **Weighted repetition.** Every character carries a running accuracy in
  `localStorage`. A character you keep missing is up to five times likelier to
  appear than one you know, and never-seen characters sit in between, so a run
  introduces new material while dragging old mistakes back in front of you.
- **Confusable distractors.** Wrong answers are the letters learners actually
  mix up — ㅂ/ㅍ, ㅓ/ㅗ, ㄷ/ㅌ — from hand-written sets in
  [`src/lib/hangul.ts`](src/lib/hangul.ts). Syllable blocks generate their own:
  every distractor differs from the answer by exactly one jamo.
- **Mistake review.** The end screen lists what you missed with its sound and a
  play button.
- **Reference chart.** `/chart` has the full table plus a consonant × vowel
  syllable grid, audio on tap.

### A note on the audio

Speech synthesis reads a bare jamo as its *letter name* — ㄱ comes out as
"기역" — which is not the sound being taught. So each letter stores a syllable
to speak instead: consonants as their ㅏ-syllable (가, 나, 다 …) and vowels as
their ㅇ-syllable (아, 어, 오 …). Syllable blocks speak themselves.

### A note on the romanization

Revised Romanization throughout. Letters whose sound depends on position carry
a single combined label — ㄱ is "g / k", not a guess between the two. Final
consonants in level 6 are limited to ㄱ ㄴ ㄹ ㅁ ㅂ ㅇ, the six that romanize
unambiguously, so no two cards ever share an answer.

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

Vercel, with the stock Next.js settings — there is nothing to configure.

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project**, import the repository.
3. Leave the framework preset on **Next.js** and the build command, output
   directory and install command on their defaults. No environment variables.
4. **Deploy.**

Later pushes to the default branch redeploy on their own.

## Built with

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Web Speech API ·
Noto Sans KR via `next/font/local`

## Performance

Lighthouse on `npm run build && npm start`:

| Page     | Mobile                  | Desktop                  |
| -------- | ----------------------- | ------------------------ |
| `/`      | 93 perf · 100 a11y/BP/SEO | 100 perf · 100 a11y/BP/SEO |
| `/chart` | 94 perf · 100 a11y/BP/SEO | 100 perf · 100 a11y/BP/SEO |

Two things got it there:

- **The font is subsetted.** Noto Sans KR ships as ~450 KB of split woff2
  chunks behind a render-blocking stylesheet, and this game paints at most a
  few hundred glyphs. [`scripts/subset-font.py`](scripts/subset-font.py) cuts
  it to exactly the characters the source and the level pools can produce —
  264 glyphs, one 27 KB file. Re-run it after changing any Korean string or
  level pool.
- **The chart doesn't hydrate.** It is a server component of static HTML with
  the syllable to speak in a `data-speak` attribute; one client island
  delegates a single click listener for all 94 buttons. Hydrating them as React
  components cost 2.3 s of blocked main thread on a mid-range phone.

## Accessibility and motion

Portrait mobile is the first-class layout; touch targets are at least 48px.
Answers are announced through a live region, and `prefers-reduced-motion`
turns the glide into eight discrete hops with a longer fall.

## Ideas for v2

Out of scope here, noted for later: accounts and cross-device sync,
leaderboards, multiplayer races, server-side progress, recorded native-speaker
audio in place of speech synthesis, whole-word and sentence levels, and the
irregular batchim/liaison rules that single syllables let us dodge.
