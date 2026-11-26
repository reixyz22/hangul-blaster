"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { poolFor, levelName, type Card } from "@/lib/levels";
import {
  buildQuestion,
  fallDurationMs,
  pickCard,
  pointsFor,
  type Mode,
  type Question,
} from "@/lib/quiz";
import type { RunSummary } from "@/lib/run";
import { mergeStats, type CharStat } from "@/lib/storage";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { SpeakerIcon } from "./SpeakButton";

const STARTING_LIVES = 3;
/** How long the correct answer stays on screen after each question. */
const FEEDBACK_MS = 950;

type GameState = {
  phase: "falling" | "feedback" | "over";
  question: Question | null;
  chosen: number | null;
  lives: number;
  score: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  results: Array<{ id: string; correct: boolean }>;
  missed: Card[];
};

type Action =
  | { type: "ask"; question: Question }
  | { type: "answer"; index: number | null; correct: boolean }
  | { type: "over" };

const INITIAL: GameState = {
  phase: "falling",
  question: null,
  chosen: null,
  lives: STARTING_LIVES,
  score: 0,
  streak: 0,
  bestStreak: 0,
  correctCount: 0,
  results: [],
  missed: [],
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "ask":
      return {
        ...state,
        phase: "falling",
        question: action.question,
        chosen: null,
      };

    case "answer": {
      const card = state.question?.card;
      if (!card || state.phase !== "falling") return state;

      const results = [...state.results, { id: card.id, correct: action.correct }];
      if (action.correct) {
        const streak = state.streak + 1;
        return {
          ...state,
          phase: "feedback",
          chosen: action.index,
          results,
          score: state.score + pointsFor(state.streak),
          streak,
          bestStreak: Math.max(state.bestStreak, streak),
          correctCount: state.correctCount + 1,
        };
      }
      return {
        ...state,
        phase: "feedback",
        chosen: action.index,
        results,
        streak: 0,
        lives: state.lives - 1,
        missed: state.missed.some((m) => m.id === card.id)
          ? state.missed
          : [...state.missed, card],
      };
    }

    case "over":
      return { ...state, phase: "over" };
  }
}

type Props = {
  level: number;
  mode: Mode;
  baseStats: Record<string, CharStat>;
  speak: (text: string) => void;
  onFinish: (run: RunSummary) => void;
  onExit: () => void;
};

function createInitialState(args: {
  pool: Card[];
  mode: Mode;
  stats: Record<string, CharStat>;
}): GameState {
  const card = pickCard(args.pool, args.stats, []);
  return { ...INITIAL, question: buildQuestion(card, args.pool, args.mode) };
}

export function Game({ level, mode, baseStats, speak, onFinish, onExit }: Props) {
  const reducedMotion = useReducedMotion();
  const pool = useMemo(() => poolFor(level), [level]);
  const [state, dispatch] = useReducer(
    reducer,
    { pool, mode, stats: baseStats },
    createInitialState,
  );

  const laneRef = useRef<HTMLDivElement>(null);
  const glyphRef = useRef<HTMLDivElement>(null);
  const timerBarRef = useRef<HTMLDivElement>(null);

  // Weighting uses stored accuracy plus what has happened in this run, so a
  // character missed two questions ago comes back around sooner.
  const liveStats = useMemo(
    () => mergeStats(baseStats, state.results),
    [baseStats, state.results],
  );

  // Every card this run has shown, newest last, so the picker can avoid
  // repeating what the player just saw.
  const recent = useMemo(() => {
    const ids = state.results.map((r) => r.id);
    if (state.question) ids.push(state.question.card.id);
    return ids;
  }, [state.results, state.question]);

  const ask = useCallback(() => {
    const card = pickCard(pool, liveStats, recent);
    dispatch({ type: "ask", question: buildQuestion(card, pool, mode) });
  }, [pool, mode, liveStats, recent]);

  // Listen mode: play the sound as soon as the question appears.
  useEffect(() => {
    if (mode !== "listen" || state.phase !== "falling" || !state.question) return;
    speak(state.question.card.speak);
  }, [mode, state.phase, state.question, speak]);

  // The fall itself. Position is written straight to the DOM so a 60fps
  // animation never costs a React render.
  useEffect(() => {
    if (state.phase !== "falling" || !state.question) return;

    const duration =
      fallDurationMs(state.correctCount) * (reducedMotion ? 1.3 : 1);
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Reduced motion: hop in eight discrete steps instead of gliding.
      const position = reducedMotion ? Math.floor(t * 8) / 8 : t;

      const lane = laneRef.current;
      const glyph = glyphRef.current;
      if (lane && glyph) {
        const travel = Math.max(0, lane.clientHeight - glyph.offsetHeight);
        glyph.style.transform = "translate3d(0, " + position * travel + "px, 0)";
      }
      if (timerBarRef.current) {
        timerBarRef.current.style.transform = "scaleX(" + (1 - t) + ")";
      }

      if (t >= 1) {
        dispatch({ type: "answer", index: null, correct: false });
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.phase, state.question, state.correctCount, reducedMotion]);

  // After the answer is shown: next question, or end the run.
  useEffect(() => {
    if (state.phase !== "feedback") return;
    const timer = window.setTimeout(() => {
      if (state.lives <= 0) dispatch({ type: "over" });
      else ask();
    }, FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.lives, ask]);

  // Hand the finished run back to the shell exactly once.
  const finishedRef = useRef(false);
  useEffect(() => {
    if (state.phase !== "over" || finishedRef.current) return;
    finishedRef.current = true;
    onFinish({
      level,
      mode,
      score: state.score,
      bestStreak: state.bestStreak,
      correctCount: state.correctCount,
      results: state.results,
      missed: state.missed,
    });
  }, [state, level, mode, onFinish]);

  const answer = useCallback(
    (index: number) => {
      if (state.phase !== "falling" || !state.question) return;
      dispatch({
        type: "answer",
        index,
        correct: index === state.question.answerIndex,
      });
    },
    [state.phase, state.question],
  );

  // Keyboard play: 1-4 pick an option.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      if (Number.isNaN(index) || index < 0 || index > 3) return;
      event.preventDefault();
      answer(index);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answer]);

  const question = state.question;
  const showRomanizationOnButtons = mode === "letter-to-sound";
  const revealing = state.phase !== "falling";
  const lastWasCorrect = state.results.at(-1)?.correct ?? false;

  const promptText =
    mode === "letter-to-sound" ? question?.card.char : question?.card.rom;

  return (
    <div className="flex min-h-dvh flex-col gap-3 px-4 pt-4 pb-5">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="h-12 rounded-xl px-3 text-sm font-medium text-slate-400 transition-colors hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          Quit
        </button>
        <div className="text-center">
          <p className="font-mono text-2xl font-bold tabular-nums text-cyan-300">
            {state.score}
          </p>
          <p className="text-[11px] uppercase tracking-widest text-slate-400">
            {levelName(level)}
          </p>
        </div>
        <Lives remaining={state.lives} />
      </header>

      <div className="h-1 overflow-hidden rounded-full bg-slate-800">
        <div
          ref={timerBarRef}
          className="h-full origin-left bg-gradient-to-r from-cyan-400 to-fuchsia-500"
        />
      </div>

      <p className="h-5 text-center text-sm font-semibold text-fuchsia-400">
        {state.streak >= 3 ? state.streak + " in a row" : ""}
      </p>

      <div
        ref={laneRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60"
      >
        <div
          ref={glyphRef}
          className="absolute inset-x-0 flex items-center justify-center will-change-transform"
        >
          {mode === "listen" ? (
            <button
              type="button"
              onClick={() => question && speak(question.card.speak)}
              aria-label="Play the sound again"
              className="grid size-24 place-items-center rounded-full border border-cyan-500/40 bg-slate-800 text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              <SpeakerIcon className="size-12" />
            </button>
          ) : (
            <span
              className={
                mode === "letter-to-sound"
                  ? "font-ko text-8xl leading-none text-slate-50"
                  : "font-mono text-6xl leading-none font-bold text-slate-50"
              }
            >
              {promptText}
            </span>
          )}
        </div>

        {revealing && question && (
          <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 p-3 text-center backdrop-blur-sm">
            <p className="text-sm text-slate-400">
              {lastWasCorrect ? "Correct" : "The answer was"}
            </p>
            <p className="font-ko text-3xl text-slate-50">
              {question.card.char}{" "}
              <span className="font-mono text-2xl text-cyan-300">
                {question.card.rom}
              </span>
            </p>
          </div>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {revealing && question
          ? (lastWasCorrect ? "Correct. " : "Wrong. ") +
            question.card.char +
            " is " +
            question.card.rom
          : mode === "letter-to-sound"
            ? "Which sound is " + (question?.card.char ?? "") + "?"
            : "Which letter is " + (question?.card.rom ?? "") + "?"}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {question?.options.map((option, index) => {
          const isAnswer = index === question.answerIndex;
          const isChosen = index === state.chosen;
          let tone =
            "border-slate-700 bg-slate-800/80 text-slate-100 hover:bg-slate-700";
          if (revealing && isAnswer) {
            tone = "border-emerald-400 bg-emerald-500/20 text-emerald-100";
          } else if (revealing && isChosen) {
            tone = "border-rose-500 bg-rose-500/20 text-rose-100";
          } else if (revealing) {
            tone = "border-slate-800 bg-slate-900/60 text-slate-400";
          }
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => answer(index)}
              disabled={revealing}
              className={
                "flex min-h-16 items-center justify-center gap-2 rounded-xl border px-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 " +
                tone
              }
            >
              <span className="hidden text-xs text-slate-400 sm:inline">
                {index + 1}
              </span>
              <span
                className={
                  showRomanizationOnButtons
                    ? "font-mono text-xl font-semibold"
                    : "font-ko text-3xl"
                }
              >
                {showRomanizationOnButtons ? option.rom : option.char}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Lives({ remaining }: { remaining: number }) {
  return (
    <p
      className="flex items-center gap-1"
      aria-label={
        Math.max(0, remaining) + " of " + STARTING_LIVES + " lives left"
      }
    >
      {Array.from({ length: STARTING_LIVES }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={
            "size-3 rounded-full " + (i < remaining ? "bg-rose-500" : "bg-slate-700")
          }
        />
      ))}
    </p>
  );
}
