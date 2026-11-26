"use client";

type Props = {
  text: string;
  label: string;
  onSpeak: (text: string) => void;
  className?: string;
};

export function SpeakButton({ text, label, onSpeak, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSpeak(text)}
      aria-label={label}
      className={`grid size-12 place-items-center rounded-full border border-slate-700 bg-slate-800/80 text-slate-200 transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${className}`}
    >
      <SpeakerIcon />
    </button>
  );
}

export function SpeakerIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}
