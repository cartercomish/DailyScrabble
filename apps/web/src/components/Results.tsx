"use client";

import type { DailyPuzzle, GameResult } from "@daily-rack/engine";
import {
  formatShare,
  puzzleBestTotal,
  scoreEmoji,
  scoreEmojiLabel,
  type ScoreEmoji,
} from "@daily-rack/engine";
import { motion } from "framer-motion";
import { useState } from "react";

interface ResultsProps {
  puzzle: DailyPuzzle;
  result: GameResult;
  streak: number;
  onViewSolution?: () => void;
  showingSolution?: boolean;
}

function resultEmoji(puzzle: DailyPuzzle, result: GameResult): ScoreEmoji {
  if (
    result.emoji === "🏆" ||
    result.emoji === "⭐" ||
    result.emoji === "📦" ||
    result.emoji === "🌊"
  ) {
    return result.emoji;
  }
  return scoreEmoji(result.totalScore, puzzleBestTotal(puzzle));
}

export function Results({
  puzzle,
  result,
  streak,
  onViewSolution,
  showingSolution,
}: ResultsProps) {
  const [copied, setCopied] = useState(false);
  const emoji = resultEmoji(puzzle, result);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/${puzzle.date}`
      : `https://manifest.game/${puzzle.date}`;

  const shareText = formatShare(
    result.puzzleNumber,
    result.totalScore,
    emoji,
    result.rounds.map((r) => r.hitBestWord),
    url,
  );

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      window.prompt("Copy your manifest:", shareText);
      return false;
    }
  }

  async function shareManifest() {
    await copyShare();

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `Manifest #${result.puzzleNumber}`,
          text: shareText,
        });
      } catch {
        /* user cancelled share sheet */
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-md px-4 pb-8"
    >
      <div className="pixel-panel p-5 text-ink" style={{ background: "#fff8e8" }}>
        <p className="font-[family-name:var(--font-ui)] text-center text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-ink-soft">
          Manifest {String(puzzle.number).padStart(3, "0")} · sealed
        </p>
        <h2
          className="mt-3 flex items-center justify-center gap-3 font-[family-name:var(--font-display)] font-bold text-ink"
          style={{ fontSize: "3.5rem", lineHeight: 1, letterSpacing: "0.06em" }}
        >
          <span>{result.totalScore}</span>
          <span style={{ fontSize: "3rem", lineHeight: 1 }}>{emoji}</span>
        </h2>
        <p
          className="mt-2 text-center font-[family-name:var(--font-display)] font-bold text-ink"
          style={{ fontSize: "1.15rem", letterSpacing: "0.05em" }}
        >
          {scoreEmojiLabel(emoji)}
          {streak > 0 ? ` · ${streak}-day run` : ""}
        </p>

        <ul className="mt-5 space-y-2">
          {result.rounds.map((round, i) => (
            <li
              key={i}
              className="flex items-center justify-between px-3 py-2.5"
              style={{
                background: "#ffe9b8",
                border: "2px solid #2a3340",
              }}
            >
              <div>
                <p className="font-[family-name:var(--font-ui)] text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-ink-soft">
                  Load {i + 1}
                </p>
                <p
                  className="font-[family-name:var(--font-display)] font-bold text-ink"
                  style={{ fontSize: "1.35rem", letterSpacing: "0.06em" }}
                >
                  {round.mainWord}
                  {round.bingo ? " ★" : ""}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="font-[family-name:var(--font-display)] font-bold text-ink"
                  style={{ fontSize: "1.6rem", letterSpacing: "0.04em", lineHeight: 1 }}
                >
                  {round.score}
                </p>
                <p
                  className={`mt-1 font-[family-name:var(--font-ui)] text-xs font-bold ${
                    round.hitBestWord ? "text-proof" : "text-ink-soft/60"
                  }`}
                >
                  {round.hitBestWord
                    ? "Top mark"
                    : `Mark: ${puzzle.rounds[i].bestWord.word}`}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={shareManifest}
            className="pixel-btn flex-1 py-3 text-center font-[family-name:var(--font-ui)] font-extrabold tracking-wide text-paper"
            style={{ background: "#2a3340" }}
          >
            {copied ? "Copied" : "Share"}
          </button>
          {onViewSolution && (
            <button
              type="button"
              onClick={onViewSolution}
              className="pixel-btn flex-1 bg-paper py-3 text-center font-[family-name:var(--font-ui)] font-extrabold tracking-wide text-ink"
            >
              {showingSolution ? "Hide solution" : "Show best solution"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
