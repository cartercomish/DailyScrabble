"use client";

import type { BoardCell, PlacedTile, SeedTile } from "@daily-rack/engine";
import { motion } from "framer-motion";
import type { DragState } from "../lib/useTileDrag";
import { TypeBlock } from "./TypeBlock";

export interface SolutionPlayView {
  word: string;
  score: number;
  tiles: PlacedTile[];
  round: number;
}

interface BoardProps {
  board: BoardCell[][];
  tentative: PlacedTile[];
  selectedCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
  onPointerDownTentative?: (
    row: number,
    col: number,
    letter: string,
    e: React.PointerEvent,
  ) => void;
  drag?: DragState | null;
  seed?: SeedTile[];
  solutionPlays?: SolutionPlayView[];
  showSolution?: boolean;
}

function premiumLabel(p: BoardCell["premium"]): string {
  if (!p) return "";
  return p;
}

export function Board({
  board,
  tentative,
  selectedCell,
  onCellClick,
  onPointerDownTentative,
  drag = null,
  seed = [],
  solutionPlays = [],
  showSolution = false,
}: BoardProps) {
  const size = board.length;
  const tentativeMap = new Map(
    tentative.map((t) => [`${t.row},${t.col}`, t.letter]),
  );
  const seedSet = new Set(seed.map((t) => `${t.row},${t.col}`));
  const solutionMap = new Map(
    solutionPlays.flatMap((p) =>
      p.tiles.map((t) => [`${t.row},${t.col}`, t.letter] as const),
    ),
  );

  const dropRow =
    drag?.moved && drag.over?.type === "cell" ? drag.over.row : null;
  const dropCol =
    drag?.moved && drag.over?.type === "cell" ? drag.over.col : null;

  return (
    <div className="pixel-panel mx-auto w-full max-w-[min(100%,520px)] p-2">
      <div className="relative">
        <div
          className="grid gap-[3px] p-[4px]"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            background: "#a88858",
            border: "3px solid #2a3340",
            boxShadow: "inset 2px 2px 0 #8a6a40, inset -2px -2px 0 #d4b888",
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r},${c}`;
              const tentativeLetter = tentativeMap.get(key);
              const solutionLetter = showSolution
                ? solutionMap.get(key)
                : undefined;
              const isSeed = seedSet.has(key);
              const playerLetter = tentativeLetter ?? cell.letter;
              const isPlayerOnly =
                Boolean(playerLetter) && !isSeed && !tentativeLetter;

              const draggingThis =
                drag?.moved &&
                drag.source.type === "board" &&
                drag.source.row === r &&
                drag.source.col === c;

              let displayLetter: string | null = null;
              let displayMode: "solid" | "ghost" | "solution" | null = null;

              if (showSolution) {
                if (solutionLetter) {
                  displayLetter = solutionLetter;
                  displayMode = "solution";
                } else if (isSeed && cell.letter) {
                  displayLetter = cell.letter;
                  displayMode = "solid";
                } else if (isPlayerOnly && playerLetter) {
                  displayLetter = playerLetter;
                  displayMode = "ghost";
                }
              } else if (playerLetter && !draggingThis) {
                displayLetter = playerLetter;
                displayMode = "solid";
              }

              const isTentative = Boolean(tentativeLetter) && !showSolution;
              const isSelected =
                selectedCell?.row === r && selectedCell?.col === c;
              const mid = Math.floor(size / 2);
              const isCenter = r === mid && c === mid && !displayLetter;
              const isDropTarget =
                !showSolution &&
                dropRow === r &&
                dropCol === c &&
                !cell.letter &&
                !(
                  drag?.source.type === "board" &&
                  drag.source.row === r &&
                  drag.source.col === c
                );

              return (
                <button
                  key={key}
                  type="button"
                  data-board-cell={`${r},${c}`}
                  onClick={() => onCellClick(r, c)}
                  onPointerDown={(e) => {
                    if (showSolution) return;
                    if (!isTentative || !onPointerDownTentative || !playerLetter)
                      return;
                    e.preventDefault();
                    e.stopPropagation();
                    onPointerDownTentative(r, c, playerLetter, e);
                  }}
                  className="relative aspect-square touch-none overflow-visible text-center active:scale-95"
                  style={{
                    background: squareBg(
                      cell,
                      Boolean(displayLetter) && displayMode !== "ghost",
                      isTentative,
                      isDropTarget,
                    ),
                    boxShadow: isDropTarget
                      ? "inset 0 0 0 2px #ffcc33"
                      : isSelected
                        ? "inset 0 0 0 2px #2a3340"
                        : displayMode === "solution"
                          ? "inset 0 0 0 2px #ffcc33"
                          : "inset 1px 1px 0 rgba(255,255,255,0.25), inset -1px -1px 0 rgba(0,0,0,0.12)",
                    cursor:
                      isTentative && !showSolution ? "grab" : undefined,
                    zIndex: displayMode === "solution" ? 2 : 1,
                  }}
                  aria-label={
                    displayLetter
                      ? `Crate ${displayLetter}`
                      : cell.premium
                        ? cell.premium
                        : isCenter
                          ? "Center berth"
                          : `Empty ${r},${c}`
                  }
                >
                  {displayLetter ? (
                    <motion.span
                      initial={isTentative ? { scale: 0.7, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      className="block h-full w-full overflow-hidden"
                    >
                      <TypeBlock
                        letter={displayLetter}
                        provisional={
                          isTentative || displayMode === "solution"
                        }
                        dimmed={displayMode === "ghost"}
                        size="board"
                      />
                    </motion.span>
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center font-[family-name:var(--font-ui)] font-extrabold tracking-tight text-ink/55"
                      style={{ fontSize: "clamp(0.55rem, 2.4vw, 0.78rem)" }}
                    >
                      {isCenter ? "★" : premiumLabel(cell.premium)}
                    </span>
                  )}
                </button>
              );
            }),
          )}
        </div>

        {showSolution &&
          solutionPlays.map((play, i) => {
            const rows = play.tiles.map((t) => t.row);
            const cols = play.tiles.map((t) => t.col);
            const minR = Math.min(...rows);
            const minC = Math.min(...cols);
            const maxC = Math.max(...cols);
            const maxR = Math.max(...rows);
            const horizontal = minR === maxR;
            const pad = 4; // matches grid p-[4px]
            const leftPct = (minC / size) * 100;
            const widthPct = horizontal
              ? ((maxC - minC + 1) / size) * 100
              : (1 / size) * 100;
            const topPct = (minR / size) * 100;

            return (
              <div
                key={`leader-${i}-${play.word}`}
                className="pointer-events-none absolute z-30 flex justify-center"
                style={{
                  left: `calc(${pad}px + (100% - ${pad * 2}px) * ${leftPct / 100})`,
                  width: `calc((100% - ${pad * 2}px) * ${widthPct / 100})`,
                  top: `calc(${pad}px + (100% - ${pad * 2}px) * ${topPct / 100} - 1.05rem)`,
                }}
              >
                <span
                  className="whitespace-nowrap px-1.5 py-0.5 font-[family-name:var(--font-display)] font-bold leading-none text-ink"
                  style={{
                    background: "#ffcc33",
                    border: "2px solid #2a3340",
                    fontSize: "0.85rem",
                    letterSpacing: "0.04em",
                    boxShadow: "2px 2px 0 rgba(42,51,64,0.2)",
                  }}
                >
                  R{play.round} · {play.score} pts
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function squareBg(
  cell: BoardCell,
  hasLetter: boolean,
  tentative: boolean,
  dropTarget = false,
): string {
  if (dropTarget) return "#ffe08a";
  if (hasLetter || tentative) return "#c4a574";
  switch (cell.premium) {
    case "TW":
      return "#f08080";
    case "DW":
      return "#f0a868";
    case "TL":
      return "#7ec8e3";
    case "DL":
      return "#88c9a1";
    default:
      return "#d8c49a";
  }
}
