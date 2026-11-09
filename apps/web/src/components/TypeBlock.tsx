"use client";

import { letterValue } from "@daily-rack/engine";

interface TypeBlockProps {
  letter: string;
  selected?: boolean;
  provisional?: boolean;
  dimmed?: boolean;
  size?: "board" | "rack" | "ghost";
  className?: string;
  style?: React.CSSProperties;
}

const CRATES = [
  "/tiles/crate-pine.svg",
  "/tiles/crate-oak.svg",
  "/tiles/crate-cedar.svg",
] as const;

function crateFor(letter: string): string {
  return CRATES[letter.toUpperCase().charCodeAt(0) % CRATES.length];
}

/** Soft-pixel shipping crate with stencil letter. */
export function TypeBlock({
  letter,
  selected = false,
  provisional = false,
  dimmed = false,
  size = "rack",
  className = "",
  style,
}: TypeBlockProps) {
  const isBoard = size === "board";
  const isGhost = size === "ghost";
  const face = crateFor(letter);

  return (
    <span
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden ${className}`}
      style={{
        backgroundColor: "#f3e0b0",
        backgroundImage: `url(${face})`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        border: selected || provisional ? "2px solid #ffcc33" : "2px solid #2a3340",
        boxShadow: selected
          ? "0 0 0 2px #fff8e8, 3px 3px 0 rgba(42,51,64,0.25)"
          : "2px 2px 0 rgba(42,51,64,0.18)",
        filter: dimmed ? "grayscale(0.55) brightness(1.08)" : undefined,
        opacity: dimmed ? 0.55 : undefined,
        ...style,
      }}
    >
      <span
        className="relative font-[family-name:var(--font-ui)] font-extrabold leading-none"
        style={{
          fontSize: isBoard
            ? "clamp(0.78rem, 3.8vw, 1.12rem)"
            : isGhost
              ? "1.55rem"
              : "clamp(1.35rem, 4.6vw, 1.6rem)",
          color: "#1a2230",
          letterSpacing: "0.01em",
        }}
      >
        {letter}
      </span>

      <span
        className="absolute font-[family-name:var(--font-ui)] font-black"
        style={{
          bottom: isBoard ? 1 : 2,
          right: isBoard ? 2 : 3,
          fontSize: isBoard
            ? "clamp(0.48rem, 2vw, 0.68rem)"
            : "0.72rem",
          color: "#1a2230",
          lineHeight: 1,
        }}
      >
        {letterValue(letter)}
      </span>
    </span>
  );
}
