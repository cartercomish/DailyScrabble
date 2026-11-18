"use client";

import type { BoardCell, PlacedTile, SeedTile } from "@daily-rack/engine";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import {
  layoutPlayTags,
  type TagSide,
} from "../lib/playTagLayout";
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
  /** Finished-game highlight of the player's own plays + score tags. */
  reviewPlays?: SolutionPlayView[];
  /** Skip outer panel chrome when nested inside the sealed manifest. */
  embedded?: boolean;
}

function premiumLabel(p: BoardCell["premium"]): string {
  if (!p) return "";
  return p;
}

const PLAYER_ACCENT = "#7ec8e3";
const SOLUTION_ACCENT = "#ffcc33";
const INK = "#2a3340";

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function tagTransform(side: TagSide): string {
  switch (side) {
    case "above":
      return "translate(-50%, -100%)";
    case "below":
      return "translate(-50%, 0)";
    case "left":
      return "translate(-100%, -50%)";
    case "right":
      return "translate(0, -50%)";
  }
}

function LeaderTriangle({ side, fill }: { side: TagSide; fill: string }) {
  const edge = 7;
  const base: CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
    pointerEvents: "none",
  };

  if (side === "above") {
    return (
      <>
        <span
          aria-hidden
          style={{
            ...base,
            left: "50%",
            bottom: -edge,
            marginLeft: -edge,
            borderLeft: `${edge}px solid transparent`,
            borderRight: `${edge}px solid transparent`,
            borderTop: `${edge}px solid ${INK}`,
          }}
        />
        <span
          aria-hidden
          style={{
            ...base,
            left: "50%",
            bottom: -(edge - 2),
            marginLeft: -(edge - 2),
            borderLeft: `${edge - 2}px solid transparent`,
            borderRight: `${edge - 2}px solid transparent`,
            borderTop: `${edge - 2}px solid ${fill}`,
          }}
        />
      </>
    );
  }
  if (side === "below") {
    return (
      <>
        <span
          aria-hidden
          style={{
            ...base,
            left: "50%",
            top: -edge,
            marginLeft: -edge,
            borderLeft: `${edge}px solid transparent`,
            borderRight: `${edge}px solid transparent`,
            borderBottom: `${edge}px solid ${INK}`,
          }}
        />
        <span
          aria-hidden
          style={{
            ...base,
            left: "50%",
            top: -(edge - 2),
            marginLeft: -(edge - 2),
            borderLeft: `${edge - 2}px solid transparent`,
            borderRight: `${edge - 2}px solid transparent`,
            borderBottom: `${edge - 2}px solid ${fill}`,
          }}
        />
      </>
    );
  }
  if (side === "left") {
    return (
      <>
        <span
          aria-hidden
          style={{
            ...base,
            top: "50%",
            right: -edge,
            marginTop: -edge,
            borderTop: `${edge}px solid transparent`,
            borderBottom: `${edge}px solid transparent`,
            borderLeft: `${edge}px solid ${INK}`,
          }}
        />
        <span
          aria-hidden
          style={{
            ...base,
            top: "50%",
            right: -(edge - 2),
            marginTop: -(edge - 2),
            borderTop: `${edge - 2}px solid transparent`,
            borderBottom: `${edge - 2}px solid transparent`,
            borderLeft: `${edge - 2}px solid ${fill}`,
          }}
        />
      </>
    );
  }
  return (
    <>
      <span
        aria-hidden
        style={{
          ...base,
          top: "50%",
          left: -edge,
          marginTop: -edge,
          borderTop: `${edge}px solid transparent`,
          borderBottom: `${edge}px solid transparent`,
          borderRight: `${edge}px solid ${INK}`,
        }}
      />
      <span
        aria-hidden
        style={{
          ...base,
          top: "50%",
          left: -(edge - 2),
          marginTop: -(edge - 2),
          borderTop: `${edge - 2}px solid transparent`,
          borderBottom: `${edge - 2}px solid transparent`,
          borderRight: `${edge - 2}px solid ${fill}`,
        }}
      />
    </>
  );
}

function PlayLeaders({
  plays,
  size,
  accent,
  occupied,
}: {
  plays: SolutionPlayView[];
  size: number;
  accent: string;
  occupied: Set<string>;
}) {
  const pad = 4;
  const placed = layoutPlayTags(plays, size, occupied);

  return (
    <>
      {placed.map(({ play, placement }, i) => {
        const left = `calc(${pad}px + (100% - ${pad * 2}px) * ${placement.cx / size})`;
        const top = `calc(${pad}px + (100% - ${pad * 2}px) * ${placement.cy / size})`;

        return (
          <div
            key={`leader-${i}-${play.round}-${play.word}`}
            className="pointer-events-none absolute z-30"
            style={{
              left,
              top,
              transform: tagTransform(placement.side),
            }}
          >
            <span
              className={`relative inline-flex items-center justify-center px-1.5 py-0.5 font-[family-name:var(--font-display)] font-bold leading-none text-ink ${
                placement.stacked ? "flex-col" : "flex-row whitespace-nowrap"
              }`}
              style={{
                background: accent,
                border: `2px solid ${INK}`,
                fontSize: "0.78rem",
                letterSpacing: "0.04em",
                boxShadow: "2px 2px 0 rgba(42,51,64,0.2)",
                gap: placement.stacked ? "0.12rem" : undefined,
              }}
            >
              {placement.stacked ? (
                <>
                  <span className="whitespace-nowrap">R{play.round}</span>
                  <span className="whitespace-nowrap">{play.score} pts</span>
                </>
              ) : (
                <span className="whitespace-nowrap">
                  R{play.round} · {play.score} pts
                </span>
              )}
              <LeaderTriangle side={placement.side} fill={accent} />
            </span>
          </div>
        );
      })}
    </>
  );
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
  reviewPlays = [],
  embedded = false,
}: BoardProps) {
  const size = board.length;
  const tentativeMap = new Map<string, string>(
    tentative.map((t) => [`${t.row},${t.col}`, t.letter]),
  );
  const tentativeGold = new Set(
    tentative.filter((t) => t.isGold).map((t) => `${t.row},${t.col}`),
  );
  const seedSet = new Set<string>(seed.map((t) => `${t.row},${t.col}`));
  const solutionMap = new Map<string, string>(
    solutionPlays.flatMap((p) =>
      p.tiles.map((t) => [`${t.row},${t.col}`, t.letter]),
    ),
  );
  const solutionGold = new Set(
    solutionPlays.flatMap((p) =>
      p.tiles.filter((t) => t.isGold).map((t) => `${t.row},${t.col}`),
    ),
  );
  const reviewSet = new Set<string>(
    reviewPlays.flatMap((p) => p.tiles.map((t) => `${t.row},${t.col}`)),
  );
  const reviewGold = new Set(
    reviewPlays.flatMap((p) =>
      p.tiles.filter((t) => t.isGold).map((t) => `${t.row},${t.col}`),
    ),
  );
  const leaderPlays = showSolution ? solutionPlays : reviewPlays;
  const highlightAccent = showSolution ? SOLUTION_ACCENT : PLAYER_ACCENT;
  const readOnly =
    embedded || showSolution || reviewPlays.length > 0;
  const occupiedLetters = new Set<string>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const key = `${r},${c}`;
      if (showSolution) {
        if (solutionMap.has(key) || board[r][c].letter) occupiedLetters.add(key);
      } else if (board[r][c].letter || tentativeMap.has(key)) {
        occupiedLetters.add(key);
      }
    }
  }

  const dropRow =
    drag?.moved && drag.over?.type === "cell" ? drag.over.row : null;
  const dropCol =
    drag?.moved && drag.over?.type === "cell" ? drag.over.col : null;

  const grid = (
      <div className="relative overflow-visible">
        <div
          className="grid gap-[3px] overflow-visible p-[4px]"
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
              const inReview = !showSolution && reviewSet.has(key);

              const draggingThis =
                drag?.moved &&
                drag.source.type === "board" &&
                drag.source.row === r &&
                drag.source.col === c;

              let displayLetter: string | null = null;
              let displayMode: "solid" | "ghost" | "solution" | "review" | null =
                null;

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
                displayMode = inReview ? "review" : "solid";
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
              const tileAccent =
                displayMode === "solution" ? SOLUTION_ACCENT : PLAYER_ACCENT;
              const highlighted =
                displayMode === "solution" || displayMode === "review";
              const isGoldTile =
                tentativeGold.has(key) ||
                Boolean(cell.gold) ||
                (showSolution && solutionGold.has(key)) ||
                (!showSolution && reviewGold.has(key));

              return (
                <button
                  key={key}
                  type="button"
                  data-board-cell={`${r},${c}`}
                  onClick={() => onCellClick(r, c)}
                  onPointerDown={(e) => {
                    if (readOnly) return;
                    if (!isTentative || !onPointerDownTentative || !playerLetter)
                      return;
                    e.preventDefault();
                    e.stopPropagation();
                    onPointerDownTentative(r, c, playerLetter, e);
                  }}
                  className={`relative aspect-square overflow-visible text-center active:scale-95${
                    readOnly ? "" : " touch-none"
                  }`}
                  style={{
                    background: squareBg(
                      cell,
                      Boolean(displayLetter) && displayMode !== "ghost",
                      isTentative,
                      isDropTarget,
                    ),
                    boxShadow: isDropTarget
                      ? `inset 0 0 0 2px ${SOLUTION_ACCENT}`
                      : isSelected
                        ? "inset 0 0 0 2px #2a3340"
                        : highlighted
                          ? `inset 0 0 0 2px ${tileAccent}`
                          : "inset 1px 1px 0 rgba(255,255,255,0.25), inset -1px -1px 0 rgba(0,0,0,0.12)",
                    cursor:
                      isTentative && !showSolution && reviewPlays.length === 0
                        ? "grab"
                        : undefined,
                    zIndex: highlighted ? 2 : 1,
                  }}
                  aria-label={
                    displayLetter
                      ? isGoldTile
                        ? `Golden crate ${displayLetter}`
                        : `Crate ${displayLetter}`
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
                        provisional={isTentative || highlighted}
                        dimmed={displayMode === "ghost"}
                        gold={isGoldTile}
                        accent={tileAccent}
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

        {leaderPlays.length > 0 && (
          <PlayLeaders
            plays={leaderPlays}
            size={size}
            accent={highlightAccent}
            occupied={occupiedLetters}
          />
        )}
      </div>
  );

  if (embedded) {
    return <div className="relative mx-auto w-full overflow-visible">{grid}</div>;
  }

  return (
    <div className="pixel-panel relative mx-auto w-full max-w-[min(100%,520px)] overflow-visible p-2">
      {grid}
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
