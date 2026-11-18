"use client";

import { letterValue } from "@daily-rack/engine";
import type { CSSProperties } from "react";

interface TypeBlockProps {
  letter: string;
  selected?: boolean;
  provisional?: boolean;
  dimmed?: boolean;
  gold?: boolean;
  /** Highlight rim when selected/provisional (player blue vs solution yellow). */
  accent?: string;
  size?: "board" | "rack" | "ghost";
  className?: string;
  style?: CSSProperties;
}

const CRATES = [
  "/tiles/crate-pine.svg",
  "/tiles/crate-oak.svg",
  "/tiles/crate-cedar.svg",
] as const;

const GOLD_CRATE = "/tiles/crate-gold.svg";

function crateFor(letter: string): string {
  return CRATES[letter.toUpperCase().charCodeAt(0) % CRATES.length];
}

/** Soft-pixel shipping crate with stencil letter. */
export function TypeBlock({
  letter,
  selected = false,
  provisional = false,
  dimmed = false,
  gold = false,
  accent = "#ffcc33",
  size = "rack",
  className = "",
  style,
}: TypeBlockProps) {
  const isBoard = size === "board";
  const isGhost = size === "ghost";
  const face = gold ? GOLD_CRATE : crateFor(letter);
  const highlight = selected || provisional;
  const points = letterValue(letter) * (gold ? 2 : 1);
  const rim = gold ? "#6e5208" : highlight ? accent : "#2a3340";
  const ink = gold ? "#3d2e05" : "#1a2230";

  return (
    <span
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden ${className}`}
      style={{
        containerType: isBoard ? "size" : undefined,
        backgroundColor: gold ? "#e8c030" : "#f3e0b0",
        backgroundImage: `url(${face})`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        border: `2px solid ${rim}`,
        boxShadow: gold
          ? selected
            ? `0 0 0 2px #fff8e8, 3px 3px 0 rgba(110,82,8,0.4)`
            : `2px 2px 0 rgba(110,82,8,0.35)`
          : selected
            ? `0 0 0 2px #fff8e8, 3px 3px 0 rgba(42,51,64,0.25)`
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
            ? "clamp(0.7rem, 48cqmin, 1.12rem)"
            : isGhost
              ? "1.55rem"
              : "clamp(1.35rem, 4.6vw, 1.6rem)",
          color: ink,
          letterSpacing: "0.01em",
          transform: isBoard ? "translateY(-8%)" : undefined,
          textShadow: gold ? "0 1px 0 rgba(255,246,168,0.55)" : undefined,
        }}
      >
        {letter}
      </span>

      <span
        className="absolute font-[family-name:var(--font-ui)] font-black"
        style={{
          bottom: isBoard ? "4%" : 2,
          right: isBoard ? "5%" : 3,
          fontSize: isBoard ? "clamp(0.34rem, 24cqmin, 0.58rem)" : "0.72rem",
          color: ink,
          lineHeight: 1,
        }}
      >
        {points}
      </span>
    </span>
  );
}
