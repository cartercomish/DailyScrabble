"use client";

import type {
  BoardCell,
  DailyPuzzle,
  GameResult,
} from "@daily-rack/engine";
import {
  formatShare,
  puzzleBestTotal,
  scoreEmoji,
  scoreEmojiLabel,
  type ScoreEmoji,
} from "@daily-rack/engine";
import { motion } from "framer-motion";
import { toBlob } from "html-to-image";
import { useRef, useState } from "react";
import { Board, type SolutionPlayView } from "./Board";

interface ResultsProps {
  puzzle: DailyPuzzle;
  result: GameResult;
  streak: number;
  board: BoardCell[][];
  reviewPlays: SolutionPlayView[];
  solutionPlays: SolutionPlayView[];
  showingSolution: boolean;
  solutionTotal: number;
  onViewSolution?: () => void;
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
  board,
  reviewPlays,
  solutionPlays,
  showingSolution,
  solutionTotal,
  onViewSolution,
}: ResultsProps) {
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [sharingBoard, setSharingBoard] = useState(false);
  const emoji = resultEmoji(puzzle, result);
  // Bare host (no https://) so chats don't unfurl a big link preview — MapTap-style.
  const shareHost =
    typeof window !== "undefined"
      ? window.location.host
      : "manifest.game";

  const shareText = formatShare(
    result.puzzleNumber,
    result.totalScore,
    emoji,
    result.rounds.map((r) => r.score),
    shareHost,
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

  async function shareScore() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch {
        /* cancelled */
        return;
      }
    }
    await copyShare();
  }

  async function shareManifestImage() {
    if (!shareCardRef.current || sharingBoard) return;
    setSharingBoard(true);
    try {
      const blob = await toBlob(shareCardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#fff8e8",
      });
      if (!blob) throw new Error("Could not capture manifest");

      const file = new File(
        [blob],
        `manifest-${String(result.puzzleNumber).padStart(3, "0")}.png`,
        { type: "image/png" },
      );

      const canShareFiles =
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (canShareFiles && typeof navigator.share === "function") {
        await navigator.share({
          files: [file],
          title: `Manifest #${result.puzzleNumber}`,
        });
      } else {
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(href);
      }
    } catch {
      /* cancelled or unsupported */
    } finally {
      setSharingBoard(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-lg px-3 pb-8 sm:px-4"
    >
      <div
        className="pixel-panel overflow-visible p-3 text-ink sm:p-4"
        style={{ background: "#fff8e8" }}
      >
        <div
          ref={shareCardRef}
          className="overflow-visible"
          style={{ background: "#fff8e8", padding: "4px 8px 12px" }}
        >
          <p className="font-[family-name:var(--font-ui)] text-center text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-ink-soft">
            Manifest {String(puzzle.number).padStart(3, "0")}
          </p>

          <h2
            className="mt-3 flex items-center justify-center gap-3 font-[family-name:var(--font-display)] font-bold text-ink"
            style={{ fontSize: "3rem", lineHeight: 1, letterSpacing: "0.06em" }}
          >
            <span>
              {showingSolution && solutionTotal > 0
                ? solutionTotal
                : result.totalScore}
            </span>
            {!showingSolution && (
              <span style={{ fontSize: "2.6rem", lineHeight: 1 }}>{emoji}</span>
            )}
          </h2>
          <p
            className="mt-2 text-center font-[family-name:var(--font-display)] font-bold text-ink"
            style={{ fontSize: "1.1rem", letterSpacing: "0.05em" }}
          >
            {showingSolution
              ? "Best solution"
              : `${scoreEmojiLabel(emoji)}${streak > 0 ? ` · ${streak}-day streak` : ""}`}
          </p>

          <div
            className="mt-3 overflow-visible"
            style={{
              paddingTop: "1.35rem",
              paddingLeft: "1.25rem",
              paddingRight: "1.25rem",
              paddingBottom: "1.25rem",
            }}
          >
            <Board
              board={board}
              tentative={[]}
              selectedCell={null}
              onCellClick={() => {}}
              seed={puzzle.seed}
              showSolution={showingSolution}
              solutionPlays={solutionPlays}
              reviewPlays={showingSolution ? [] : reviewPlays}
              embedded
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={shareScore}
            className="pixel-btn py-3 text-center font-[family-name:var(--font-ui)] font-extrabold tracking-wide text-paper"
            style={{ background: "#2a3340" }}
          >
            {copied ? "Copied" : "Share score"}
          </button>
          <button
            type="button"
            onClick={shareManifestImage}
            disabled={sharingBoard}
            className="pixel-btn bg-paper py-3 text-center font-[family-name:var(--font-ui)] font-extrabold tracking-wide text-ink disabled:opacity-60"
          >
            {sharingBoard ? "Saving…" : "Share board"}
          </button>
          {onViewSolution && (
            <button
              type="button"
              onClick={onViewSolution}
              className="pixel-btn bg-paper py-3 text-center font-[family-name:var(--font-ui)] font-extrabold tracking-wide text-ink"
            >
              {showingSolution ? "Hide solution" : "Show best solution"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
