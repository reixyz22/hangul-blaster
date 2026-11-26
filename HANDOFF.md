# Handoff

Everything a fresh session needs to pick this up. Written 2026-11-25 at the
end of the session that built it.

## Where things stand

- Repo: <https://github.com/reixyz22/hangul-blaster>, branch `main`, up to date.
- `9f9ea11` — first version: multiple-choice falling letters, six levels.
- `1554d3f` — **current**: rebuilt as a typing shooter. The first version was
  rejected as "functionally indistinguishable from timed flash cards". Read
  that commit message; it explains every decision.
- Local checkout: `C:\Users\pitts\hangul-blaster`. `gh` 2.105.0 is installed
  but **not logged in**; pushes work off the existing Git Credential Manager
  credential, so `git push` just works.
- **Not deployed.** Vercel import has never been run. It is a stock Next.js
  app — import the repo, change nothing, deploy.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm run lint         # eslint
npx tsc --noEmit     # typecheck
```

Lighthouse on the production build, last measured at `1554d3f`: mobile 96 (`/`)
and 95 (`/chart`) performance; desktop 100; accessibility, best-practices and
SEO 100 on both pages, both form factors. **Keep it there** — it is a stated
requirement, not a nice-to-have.

## Design rules — do not quietly undo these

These came from the person who owns the project. Several look like bugs or
omissions if you don't know the reasoning.

1. **No romanization anywhere.** Not on meteors, not on buttons, not on the
   reference page. A letter is a shape, a sound and a key. The only Latin in
   the app is keycaps, which are keyboard positions rather than
   pronunciations. Adding "ㄱ = g/k" back would reverse the whole point.

   Honest footing: no controlled study compares romanized against Hangul-only
   instruction in Korean. The supporting evidence is that L1 orthographic
   interference is robust in L2 word learning, and that in
   [Pae, Lee & Yi (2025)](https://link.springer.com/article/10.1186/s40862-025-00348-7)
   the grapheme-emphasis group won the grapheme-matching test and nothing
   else. If you are asked about this, do not overclaim it.

2. **Syllables early.** Bare jamo are an on-ramp. ㅏ and ㄱ arrive in the first
   two waves and 가 falls in wave 3; after that most targets are blocks. Same
   2025 study: the syllable-emphasis group read trained *and* novel words more
   accurately. The old level structure (five levels of jamo, syllables last)
   was the losing arm of that experiment. `INTRO_ORDER` in
   `src/lib/curriculum.ts` is sequenced for this, not in 가나다 order.

3. **No menu.** One press starts a run. That press is also what buys speech
   synthesis its required user gesture — see `start()` in `src/app/page.tsx`,
   which calls `speak(" ")`. Do not "clean that up".

4. **No difficulty setting.** Per-letter mastery weighting *is* the
   difficulty: letters you own fall fast and score more, letters you fumble
   fall slow and recur. `weightOf` / `fallDurationMs` in `curriculum.ts`.

5. **Streak is the local calendar day**, not a session counter. It survives a
   missed hour, breaks on a missed day. `currentStreak` in `src/lib/storage.ts`.

6. **Mnemonics are 가나다-book style.** ㄱ 기차, ㄴ 나비, ㅅ 사과. The vowel
   cards deliberately use words beginning with silent ㅇ — 아기, 오이, 우산 —
   because no Korean word starts with a bare vowel. That is the lesson, not a
   workaround. The `gloss` field in `src/lib/mnemonics.ts` is the **only
   English in the app**, appears only on a letter's introduction card, and is
   a placeholder for artwork.

7. **No Korean webfont.** The game composes syllables at runtime, so its glyph
   set is most of the 11,172 Hangul blocks — a subset cannot carry it, and
   full Noto Sans KR is ~450 KB of split chunks behind a render-blocking
   stylesheet. `--font-ko` in `globals.css` asks for the platform's own Korean
   face. An earlier commit shipped a 264-glyph subset and a
   `scripts/subset-font.py`; **that approach is dead**, do not revive it.

## Map of the code

| File | What it holds |
| --- | --- |
| `src/lib/keyboard.ts` | Dubeolsik mapping, `KeyboardEvent` → jamo, syllable compose/decompose, keystroke sequences |
| `src/lib/curriculum.ts` | Wave schedule, `INTRO_ORDER`, target generation, mastery weighting, fall speed, scoring, `speechFor` |
| `src/lib/mnemonics.ts` | One Korean word per letter |
| `src/lib/hangul.ts` | Letter inventory and Korean letter names, for the reference page only |
| `src/lib/storage.ts` | `localStorage` (`hangul-blaster:v2`), daily streak, run summary, external store |
| `src/components/Blaster.tsx` | The game: reducer, spawn, lock-on, rAF motion, ship, beam, wave intro |
| `src/components/Keypad.tsx` | On-screen dubeolsik — input on phones, reference on desktop |
| `src/components/RunStats.tsx` | Post-run screen, streak, review lists |
| `src/app/chart/page.tsx` | `/chart` — the 자판 reference, a server component |
| `src/components/ChartAudio.tsx` | The only client JS on `/chart` |

## Gotchas that will bite you

- **Input is key-based, not jamo-based.** Compound vowels take two keystrokes
  (ㅘ is `h` then `k`), so a target's progress is counted in keys and
  `stops[]` maps keystroke counts to completed jamo. Don't "simplify" it to
  one-input-per-jamo.
- **Physical keys are read via `event.code`,** so the mapping holds whatever
  OS layout is loaded. If a Korean IME *is* active, the jamo arrives in
  `event.key` and is used as-is. Both paths are live in `jamoFromEvent`.
- **Speech reads a bare jamo as its letter name** — ㄱ comes out "기역". Use
  `speechFor()`, which speaks a lone consonant as its ㅏ-syllable and a lone
  vowel as its ㅇ-syllable. Never hand a bare jamo to `speak()`.
- **Next 16 `cacheComponents` rejects `new Date()` during prerender.** The
  build fails, not just warns. `currentStreak` reads the clock only after an
  early return for the empty state. Same care is needed anywhere else a clock
  creeps into render.
- **ESLint here enforces React's rules hard:** no ref writes during render, no
  synchronous `setState` in an effect. Several places use
  `useSyncExternalStore` or a lazy reducer initialiser specifically to satisfy
  this. `npm run lint` before you commit.
- **The dev server's console accumulates stale HMR errors** across a large
  refactor. Trust `npm run build`, not old console noise.
- `AGENTS.md` is generated by `next dev` and re-appears if deleted.

## Open work, roughly in priority order

1. **Picture meteors.** The agreed next step and the reason `gloss` exists:
   replace the English glosses with artwork, so a letter's introduction card
   is a picture rather than a word in a language the learner doesn't read yet.
   Inline SVG, ~40 drawings, one per entry in `mnemonics.ts`.
2. **Gamification extras** discussed but not built: a slow-time charge earned
   by streaks and spent when overwhelmed; a boss target or short word at the
   end of a wave.
3. **Deploy to Vercel** and check on a real phone. The one thing that cannot
   be verified from a desktop is whether the phone has a Korean TTS voice — if
   it doesn't, the silent meteors have no clue to offer and the reference
   page's audio stays inert. Both degrade on purpose, but nobody has watched
   it happen.
4. `gh auth login` was started and never answered. It is interactive, so it
   needs a real terminal.

## Things that were explicitly ruled out

Accounts, leaderboards, multiplayer, server-side storage, paid audio. Noted as
v2 ideas only.
