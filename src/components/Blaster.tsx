"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  fallDurationMs,
  nextTarget,
  pointsFor,
  speechFor,
  waveFor,
  type CharStat,
  type Target,
} from "@/lib/curriculum";
import { JAMO_TO_KEY, jamoFromEvent, keysForJamo, partial } from "@/lib/keyboard";
import { mnemonicFor } from "@/lib/mnemonics";
import { mergeStats, type RunSummary } from "@/lib/storage";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { Keypad } from "./Keypad";

const STARTING_LIVES = 3;
const INTRO_MS = 2800;

interface LiveMeteor {
  target: Target;
  /** Horizontal lane, 0 to 1. */
  x: number;
  bornAt: number;
  duration: number;
  /** Keystrokes landed so far. */
  struck: number;
  /** Cumulative keystroke count at which each jamo completes. */
  stops: number[];
}

type GameState = {
  phase: "intro" | "playing" | "over";
  waveIndex: number;
  spawnedThisWave: number;
  meteors: LiveMeteor[];
  lockedId: string | null;
  score: number;
  lives: number;
  streak: number;
  bestStreak: number;
  results: Array<{ jamo: string; hit: boolean }>;
  missed: Array<{ char: string; jamo: string[] }>;
  keystrokes: number;
  misfires: number;
  lastHitAt: number;
};

type Action =
  | { type: "begin-wave" }
  | { type: "next-wave" }
  | { type: "spawn"; meteor: LiveMeteor }
  | { type: "input"; jamo: string; at: number }
  | { type: "land"; id: string };

const INITIAL: GameState = {
  phase: "intro",
  waveIndex: 1,
  spawnedThisWave: 0,
  meteors: [],
  lockedId: null,
  score: 0,
  lives: STARTING_LIVES,
  streak: 0,
  bestStreak: 0,
  results: [],
  missed: [],
  keystrokes: 0,
  misfires: 0,
  lastHitAt: 0,
};

/** Which jamo the next keystroke is working on. */
function jamoIndexFor(stops: number[], struck: number): number {
  const index = stops.findIndex((stop) => stop > struck);
  return index === -1 ? stops.length - 1 : index;
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "begin-wave":
      return { ...state, phase: "playing", spawnedThisWave: 0 };

    case "next-wave":
      return { ...state, phase: "intro", waveIndex: state.waveIndex + 1 };

    case "spawn":
      return {
        ...state,
        meteors: [...state.meteors, action.meteor],
        spawnedThisWave: state.spawnedThisWave + 1,
      };

    case "land": {
      const hit = state.meteors.find((m) => m.target.id === action.id);
      if (!hit) return state;
      const lives = state.lives - 1;
      return {
        ...state,
        meteors: state.meteors.filter((m) => m.target.id !== action.id),
        lockedId: state.lockedId === action.id ? null : state.lockedId,
        lives,
        streak: 0,
        phase: lives <= 0 ? "over" : state.phase,
        results: [
          ...state.results,
          ...hit.target.jamo.map((jamo) => ({ jamo, hit: false })),
        ],
        missed: state.missed.some((m) => m.char === hit.target.char)
          ? state.missed
          : [
              ...state.missed,
              { char: hit.target.char, jamo: hit.target.jamo },
            ],
      };
    }

    case "input": {
      if (state.phase !== "playing") return state;
      const key = JAMO_TO_KEY.get(action.jamo);
      if (!key) return state;

      const keystrokes = state.keystrokes + 1;
      let locked =
        state.meteors.find((m) => m.target.id === state.lockedId) ?? null;

      // Nothing locked: this keystroke chooses a target, and it has to be the
      // first letter of one. Whichever is closest to landing wins the lock.
      if (!locked) {
        const candidates = state.meteors
          .filter((m) => m.target.keys[0] === key)
          .sort(
            (a, b) => a.bornAt + a.duration - (b.bornAt + b.duration),
          );
        locked = candidates[0] ?? null;
        if (!locked) {
          return {
            ...state,
            keystrokes,
            misfires: state.misfires + 1,
            streak: 0,
          };
        }
      }

      const lockedId = locked.target.id;

      if (locked.target.keys[locked.struck] !== key) {
        // Wrong letter. The meteor knits itself back together and the lock
        // breaks, so a miss costs the progress rather than a life.
        const wanted = locked.target.jamo[jamoIndexFor(locked.stops, locked.struck)];
        return {
          ...state,
          keystrokes,
          misfires: state.misfires + 1,
          streak: 0,
          lockedId: null,
          results: [...state.results, { jamo: wanted, hit: false }],
          meteors: state.meteors.map((m) =>
            m.target.id === lockedId ? { ...m, struck: 0 } : m,
          ),
        };
      }

      const struck = locked.struck + 1;
      const finished = locked.stops.indexOf(struck);
      const results =
        finished >= 0
          ? [
              ...state.results,
              { jamo: locked.target.jamo[finished], hit: true },
            ]
          : state.results;

      if (struck >= locked.target.keys.length) {
        const streak = state.streak + 1;
        return {
          ...state,
          keystrokes,
          results,
          meteors: state.meteors.filter((m) => m.target.id !== lockedId),
          lockedId: null,
          score: state.score + pointsFor(locked.target, state.streak),
          streak,
          bestStreak: Math.max(state.bestStreak, streak),
          lastHitAt: action.at,
        };
      }

      return {
        ...state,
        keystrokes,
        results,
        lockedId,
        lastHitAt: action.at,
        meteors: state.meteors.map((m) =>
          m.target.id === lockedId ? { ...m, struck } : m,
        ),
      };
    }
  }
}

type Props = {
  baseStats: Record<string, CharStat>;
  speak: (text: string) => void;
  onFinish: (run: RunSummary) => void;
  onQuit: () => void;
};

export function Blaster({ baseStats, speak, onFinish, onQuit }: Props) {
  const reducedMotion = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const fieldRef = useRef<HTMLDivElement>(null);
  const shipRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef(new Map<string, HTMLDivElement>());
  // The animation frame reads the world through these rather than through
  // props it would have to re-subscribe to sixty times a second.
  const meteorsRef = useRef(state.meteors);
  const lockedRef = useRef(state.lockedId);
  const lastHitRef = useRef(state.lastHitAt);

  const wave = useMemo(() => waveFor(state.waveIndex), [state.waveIndex]);

  const liveStats = useMemo(
    () => mergeStats(baseStats, state.results),
    [baseStats, state.results],
  );
  const statsRef = useRef(liveStats);
  const speakRef = useRef(speak);
  useEffect(() => {
    statsRef.current = liveStats;
    speakRef.current = speak;
    meteorsRef.current = state.meteors;
    lockedRef.current = state.lockedId;
    lastHitRef.current = state.lastHitAt;
  }, [liveStats, speak, state.meteors, state.lockedId, state.lastHitAt]);

  // ── The wave intro card ──────────────────────────────────────────────────
  const beginWave = useCallback(() => dispatch({ type: "begin-wave" }), []);

  useEffect(() => {
    if (state.phase !== "intro") return;
    if (!wave.introduces) {
      beginWave();
      return;
    }
    const mnemonic = mnemonicFor(wave.introduces);
    if (mnemonic) speakRef.current(mnemonic.word);
    const timer = window.setTimeout(beginWave, INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [state.phase, wave.introduces, beginWave]);

  // ── Spawning ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== "playing") return;
    if (state.spawnedThisWave >= wave.targetCount) return;

    const delay = state.spawnedThisWave === 0 ? 350 : wave.spawnGapMs;
    const timer = window.setTimeout(() => {
      const target = nextTarget(state.waveIndex, statsRef.current);
      const stops: number[] = [];
      let total = 0;
      for (const jamo of target.jamo) {
        total += keysForJamo(jamo).length;
        stops.push(total);
      }
      dispatch({
        type: "spawn",
        meteor: {
          target,
          x: 0.14 + Math.random() * 0.72,
          bornAt: performance.now(),
          duration: fallDurationMs(target, state.waveIndex, statsRef.current),
          struck: 0,
          stops,
        },
      });
      // Every meteor announces itself. On a silent one it is the only clue.
      speakRef.current(speechFor(target.char));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    state.phase,
    state.spawnedThisWave,
    state.waveIndex,
    wave.targetCount,
    wave.spawnGapMs,
  ]);

  // ── Wave cleared ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== "playing") return;
    if (state.spawnedThisWave < wave.targetCount) return;
    if (state.meteors.length > 0) return;
    const timer = window.setTimeout(() => dispatch({ type: "next-wave" }), 700);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.spawnedThisWave, state.meteors.length, wave.targetCount]);

  // ── Motion ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== "playing") return;
    let frame = 0;

    const tick = (now: number) => {
      const field = fieldRef.current;
      if (field) {
        const travel = Math.max(0, field.clientHeight - 96);
        let lockedPoint: { x: number; y: number } | null = null;

        for (const meteor of meteorsRef.current) {
          const node = nodesRef.current.get(meteor.target.id);
          if (!node) continue;
          const raw = (now - meteor.bornAt) / meteor.duration;
          const t = Math.min(1, raw);
          const eased = reducedMotion ? Math.floor(t * 10) / 10 : t;
          const y = eased * travel;
          node.style.transform = `translate3d(-50%, ${y}px, 0)`;

          if (meteor.target.id === lockedRef.current) {
            lockedPoint = { x: meteor.x * field.clientWidth, y: y + 48 };
          }
          if (raw >= 1) dispatch({ type: "land", id: meteor.target.id });
        }

        // Point the ship at whatever is locked, and flash the beam on a hit.
        const ship = shipRef.current;
        const beam = beamRef.current;
        const originX = field.clientWidth / 2;
        const originY = field.clientHeight;
        if (ship) {
          const angle = lockedPoint
            ? Math.atan2(lockedPoint.x - originX, originY - lockedPoint.y)
            : 0;
          ship.style.transform = `translate(-50%, 0) rotate(${angle}rad)`;
        }
        if (beam) {
          const firing = lockedPoint && now - lastHitRef.current < 130;
          if (firing && lockedPoint) {
            const dx = lockedPoint.x - originX;
            const dy = originY - lockedPoint.y;
            beam.style.height = `${Math.hypot(dx, dy)}px`;
            beam.style.transform = `translate(-50%, -100%) rotate(${Math.atan2(dx, dy)}rad)`;
            beam.style.opacity = "1";
          } else {
            beam.style.opacity = "0";
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.phase, reducedMotion]);

  // ── Input ────────────────────────────────────────────────────────────────
  const sendJamo = useCallback((jamo: string) => {
    dispatch({ type: "input", jamo, at: performance.now() });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const jamo = jamoFromEvent(event);
      if (!jamo) return;
      event.preventDefault();
      sendJamo(jamo);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sendJamo]);

  // ── Finish ───────────────────────────────────────────────────────────────
  const finishedRef = useRef(false);
  useEffect(() => {
    if (state.phase !== "over" || finishedRef.current) return;
    finishedRef.current = true;
    onFinish({
      score: state.score,
      wave: state.waveIndex,
      results: state.results,
      missed: state.missed,
      keystrokes: state.keystrokes,
      misfires: state.misfires,
    });
  }, [state, onFinish]);

  const locked =
    state.meteors.find((m) => m.target.id === state.lockedId) ?? null;
  const expectedKey = locked
    ? (locked.target.keys[locked.struck] ?? null)
    : null;

  return (
    <div className="flex min-h-dvh flex-col gap-2 px-3 pt-3 pb-3">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onQuit}
          aria-label="End this run"
          className="h-11 rounded-xl px-3 text-sm text-slate-400 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          ✕
        </button>
        <p className="font-mono text-xl font-bold tabular-nums text-cyan-300">
          {state.score}
        </p>
        <p className="font-ko text-sm text-slate-400">
          {state.waveIndex}
          <span className="text-slate-600"> 파</span>
        </p>
        <p
          className="flex items-center gap-1"
          aria-label={`${Math.max(0, state.lives)} shields left`}
        >
          {Array.from({ length: STARTING_LIVES }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={
                "size-2.5 rotate-45 " +
                (i < state.lives ? "bg-cyan-400" : "bg-slate-700")
              }
            />
          ))}
        </p>
      </header>

      <div
        ref={fieldRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(ellipse_at_top,#0b1733,#020617_70%)]"
      >
        {state.meteors.map((meteor) => (
          <Meteor
            key={meteor.target.id}
            meteor={meteor}
            locked={meteor.target.id === state.lockedId}
            register={(node) => {
              if (node) nodesRef.current.set(meteor.target.id, node);
              else nodesRef.current.delete(meteor.target.id);
            }}
          />
        ))}

        <div
          ref={beamRef}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 w-0.5 origin-bottom bg-gradient-to-t from-cyan-200 to-transparent opacity-0"
        />

        <div
          ref={shipRef}
          aria-hidden="true"
          className="absolute bottom-1 left-1/2 origin-bottom"
        >
          <Ship />
        </div>

        {state.phase === "intro" && wave.introduces && (
          <WaveIntro jamo={wave.introduces} onSkip={beginWave} />
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {locked
          ? `Locked on ${locked.target.char}`
          : `Wave ${state.waveIndex}, ${state.meteors.length} incoming`}
      </p>

      <Keypad
        expectedKey={expectedKey}
        onJamo={sendJamo}
        disabled={state.phase !== "playing"}
      />
    </div>
  );
}

function Meteor({
  meteor,
  locked,
  register,
}: {
  meteor: LiveMeteor;
  locked: boolean;
  register: (node: HTMLDivElement | null) => void;
}) {
  const doneJamo = meteor.stops.filter((stop) => stop <= meteor.struck).length;
  const built = partial(meteor.target.jamo.slice(0, doneJamo));

  return (
    <div
      ref={register}
      className="absolute top-0 flex w-24 flex-col items-center will-change-transform"
      style={{ left: `${meteor.x * 100}%` }}
    >
      <div
        className={
          "grid size-20 place-items-center rounded-[42%_58%_46%_54%/54%_46%_58%_42%] border-2 transition-colors " +
          (locked
            ? "border-cyan-300 bg-cyan-500/20 shadow-[0_0_24px_rgba(34,211,238,0.45)]"
            : "border-slate-600 bg-slate-800/80")
        }
      >
        {meteor.target.silent ? (
          <span className="text-3xl text-fuchsia-300" aria-hidden="true">
            ◍
          </span>
        ) : (
          <span className="font-ko text-4xl leading-none text-slate-50">
            {meteor.target.char}
          </span>
        )}
      </div>

      {/* The letters underneath, lighting up as they are struck. */}
      {!meteor.target.silent && meteor.target.jamo.length > 1 && (
        <p className="font-ko mt-1 flex gap-1 text-sm">
          {meteor.target.jamo.map((jamo, index) => (
            <span
              key={index}
              className={index < doneJamo ? "text-cyan-300" : "text-slate-500"}
            >
              {jamo}
            </span>
          ))}
        </p>
      )}
      {built && meteor.struck > 0 && (
        <p className="font-ko text-xs text-cyan-200">{built}</p>
      )}
    </div>
  );
}

function Ship() {
  return (
    <svg width="46" height="40" viewBox="0 0 46 40" aria-hidden="true">
      <path d="M23 0 L40 34 L23 26 L6 34 Z" fill="#22d3ee" />
      <path d="M23 8 L23 26" stroke="#0e7490" strokeWidth="2" />
    </svg>
  );
}

function WaveIntro({ jamo, onSkip }: { jamo: string; onSkip: () => void }) {
  const mnemonic = mnemonicFor(jamo);
  return (
    <button
      type="button"
      onClick={onSkip}
      className="absolute inset-0 grid place-items-center bg-slate-950/90 backdrop-blur-sm"
    >
      <span className="flex flex-col items-center gap-2">
        <span className="font-ko text-8xl leading-none text-cyan-300">
          {jamo}
        </span>
        {mnemonic && (
          <>
            <span className="font-ko text-3xl text-slate-50">
              {mnemonic.word}
            </span>
            <span className="text-xs text-slate-500">{mnemonic.gloss}</span>
          </>
        )}
        <span className="mt-2 rounded-lg border border-slate-700 px-3 py-1 font-mono text-sm text-slate-300 uppercase">
          {keysForJamo(jamo)}
        </span>
      </span>
    </button>
  );
}
