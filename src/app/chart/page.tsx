import type { Metadata } from "next";
import Link from "next/link";
import { ChartAudio } from "@/components/ChartAudio";
import { GROUPS, LETTERS } from "@/lib/hangul";
import { compose, keyCapFor } from "@/lib/keyboard";
import { mnemonicFor } from "@/lib/mnemonics";
import { speechFor } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "자판 · Hangul Blaster",
  description:
    "Every Korean letter with the key that types it, the word that remembers it, and audio on tap.",
};

const CHART_INITIALS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅈ", "ㅎ"];
const CHART_VOWELS = ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"];

// A server component: the whole reference is static HTML, and <ChartAudio />
// is the only JavaScript on the page.
export default function ChartPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <ChartAudio />

      <Link
        href="/"
        className="inline-flex min-h-12 items-center rounded-xl pr-3 text-sm font-medium text-cyan-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
      >
        ← <span className="font-ko ml-1">돌아가기</span>
      </Link>

      <h1 className="font-ko mt-2 text-3xl font-extrabold tracking-tight text-slate-50">
        자판
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Each letter with the key that types it and the word that remembers it.
        No romanization anywhere: the keycaps are positions on a keyboard, not
        pronunciations.{" "}
        <span className="ko-audio-on">Tap any letter to hear it.</span>
        <span className="ko-audio-off">
          Audio needs a Korean voice, which this device does not have.
        </span>
      </p>

      <p className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-400">
        <span className="font-ko text-slate-200">모음</span> cannot start a
        Korean word on their own, so every vowel below is remembered through a
        word that begins with a silent{" "}
        <span className="font-ko text-cyan-300">ㅇ</span> — 아기, 오이, 우산.
        That is the rule, not an exception.
      </p>

      {GROUPS.map((group) => (
        <section key={group} className="mt-8">
          <h2 className="font-ko mb-3 text-sm font-semibold text-slate-400">
            {group}
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LETTERS.filter((letter) => letter.group === group).map((letter) => {
              const mnemonic = mnemonicFor(letter.char);
              return (
                <li key={letter.char}>
                  <button
                    type="button"
                    data-speak={speechFor(letter.char)}
                    disabled
                    aria-label={`${letter.name}, key ${keyCapFor(letter.char)}`}
                    className="grid min-h-16 w-full grid-cols-[2.5rem_1fr_auto] items-center gap-x-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 text-left transition-colors enabled:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                  >
                    <span className="font-ko row-span-2 text-center text-3xl text-slate-50">
                      {letter.char}
                    </span>
                    <span className="font-ko text-base text-slate-100">
                      {mnemonic ? mnemonic.word : letter.name}
                    </span>
                    <span className="row-span-2 rounded border border-slate-700 px-2 py-0.5 text-center font-mono text-xs text-slate-300 uppercase">
                      {keyCapFor(letter.char)}
                    </span>
                    <span className="font-ko text-xs text-slate-400">
                      {letter.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="mt-8">
        <h2 className="font-ko mb-3 text-sm font-semibold text-slate-400">
          글자 만들기
        </h2>
        <p className="mb-3 text-sm text-slate-400">
          A consonant on the left or on top, a vowel beside or beneath it, read
          in that order. Typing one is the same two keystrokes.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full border-collapse text-center">
            <caption className="sr-only">
              Consonants crossed with basic vowels
            </caption>
            <thead>
              <tr>
                <th scope="col" className="p-2">
                  <span className="sr-only">자음</span>
                </th>
                {CHART_VOWELS.map((vowel) => (
                  <th
                    key={vowel}
                    scope="col"
                    className="font-ko p-2 text-lg font-normal text-fuchsia-400"
                  >
                    {vowel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHART_INITIALS.map((initial) => (
                <tr key={initial} className="border-t border-slate-800">
                  <th
                    scope="row"
                    className="font-ko p-2 text-lg font-normal text-cyan-300"
                  >
                    {initial}
                  </th>
                  {CHART_VOWELS.map((vowel) => {
                    const syllable = compose(initial, vowel);
                    return (
                      <td key={vowel} className="p-0">
                        <button
                          type="button"
                          data-speak={syllable}
                          disabled
                          aria-label={syllable}
                          className="font-ko flex min-h-14 w-full items-center justify-center text-xl text-slate-50 transition-colors enabled:hover:bg-slate-800 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-cyan-400"
                        >
                          {syllable}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
