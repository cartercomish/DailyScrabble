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
  onViewSolution,
}: ResultsProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [sharingBoard, setSharingBoard] = useState(false);
  const emoji = resultEmoji(puzzle, result);
  const url =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://manifest.game";

  const shareText = formatShare(
    result.puzzleNumber,
    result.totalScore,
    emoji,
    result.rounds.map((r) => r.score),
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

  async function shareScore() {
    await copyShare();

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `Manifest #${result.puzzleNumber}`,
          text: shareText,
        });
      } catch {
        /* cancelled */
      }
    }
  }

  async function shareBoard() {
    if (!boardRef.current || sharingBoard) return;
    setSharingBoard(true);
    try {
      const blob = await toBlob(boardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#fff8e8",
      });
      if (!blob) throw new Error("Could not capture board");

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
          text: shareText,
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
      <div className="pixel-panel p-3 text-ink sm:p-4" style={{ background: "#fff8e8" }}>
        <p className="font-[family-name:var(--font-ui)] text-center text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-ink-soft">
          Manifest {String(puzzle.number).padStart(3, "0")}
          {streak > 0 ? ` · ${streak}-day run` : ""}
        </p>

        <div ref={boardRef} className="mt-3">
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
            onClick={shareBoard}
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
