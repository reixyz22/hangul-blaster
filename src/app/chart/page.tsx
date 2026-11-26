import type { Metadata } from "next";
import Link from "next/link";
import { ChartAudio } from "@/components/ChartAudio";
import { JAMO, jamo } from "@/lib/hangul";
import { compose } from "@/lib/levels";

export const metadata: Metadata = {
  title: "Hangul reference · Hangul Blaster",
  description:
    "Every Korean letter with its Revised Romanization, plus a consonant by vowel syllable grid. Tap to hear it.",
};

const CHART_INITIALS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅈ", "ㅎ"];
const CHART_VOWELS = ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"];

const GROUPS = [
  { title: "Basic consonants", level: 1 },
  { title: "Basic vowels", level: 2 },
  { title: "Y-vowels", level: 3 },
  { title: "Aspirated & tense", level: 4 },
  { title: "Compound vowels", level: 5 },
];

// A server component: the whole chart is static HTML, and <ChartAudio /> is the
// only JavaScript on the page.
export default function ChartPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <ChartAudio />

      <Link
        href="/"
        className="inline-flex min-h-12 items-center rounded-xl pr-3 text-sm font-medium text-cyan-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
      >
        Back to the game
      </Link>

      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-50">
        Hangul reference
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Revised Romanization. Letters with two sounds take the first in front of
        a vowel and the second at the end of a syllable.{" "}
        <span className="ko-audio-on">Tap any letter to hear it.</span>
        <span className="ko-audio-off">
          Audio needs a Korean voice, which this device does not have.
        </span>
      </p>

      {GROUPS.map((group) => (
        <section key={group.title} className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            {group.title}
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {JAMO.filter((j) => j.level === group.level).map((j) => (
              <li key={j.char}>
                <button
                  type="button"
                  data-speak={j.speak}
                  disabled
                  aria-label={j.char + ", " + j.rom + ", spoken as " + j.speak}
                  className="grid min-h-16 w-full grid-cols-[2.5rem_1fr] items-center gap-x-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 text-left transition-colors enabled:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                >
                  <span className="font-ko row-span-2 text-center text-3xl text-slate-50">
                    {j.char}
                  </span>
                  <span className="font-mono text-base text-cyan-300">
                    {j.rom}
                  </span>
                  <span className="font-ko text-xs text-slate-400">{j.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Syllable blocks
        </h2>
        <p className="mb-3 text-sm text-slate-400">
          A consonant on the left or on top, a vowel beside or beneath it. The
          two are read in that order.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full border-collapse text-center">
            <caption className="sr-only">
              Consonants crossed with basic vowels
            </caption>
            <thead>
              <tr>
                <th scope="col" className="p-2">
                  <span className="sr-only">Consonant</span>
                </th>
                {CHART_VOWELS.map((v) => (
                  <th
                    key={v}
                    scope="col"
                    className="font-ko p-2 text-lg font-normal text-fuchsia-400"
                  >
                    {v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHART_INITIALS.map((c) => (
                <tr key={c} className="border-t border-slate-800">
                  <th
                    scope="row"
                    className="font-ko p-2 text-lg font-normal text-cyan-300"
                  >
                    {c}
                  </th>
                  {CHART_VOWELS.map((v) => {
                    const syllable = compose(c, v);
                    const rom = jamo(c).initial + jamo(v).initial;
                    return (
                      <td key={v} className="p-0">
                        <button
                          type="button"
                          data-speak={syllable}
                          disabled
                          aria-label={syllable + ", " + rom}
                          className="flex min-h-14 w-full flex-col items-center justify-center transition-colors enabled:hover:bg-slate-800 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-cyan-400"
                        >
                          <span className="font-ko text-xl text-slate-50">
                            {syllable}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {rom}
                          </span>
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
