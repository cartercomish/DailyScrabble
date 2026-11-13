"use client";

import type { BoardCell, PlacedTile, SeedTile } from "@daily-rack/engine";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
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

/** Conservative tag size in board-cell units (no layout measurement). */
const TAG_W = 2.6;
const TAG_H = 0.75;
const TAG_GAP = 0.08;
const INK = "#2a3340";

type TagSide = "above" | "below" | "left" | "right";

interface TagBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface TagPlacement {
  side: TagSide;
  /** Cell this tag points at — never shared across plays. */
  anchorRow: number;
  anchorCol: number;
  cx: number;
  cy: number;
  box: TagBox;
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function boxesOverlap(a: TagBox, b: TagBox): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

function tagOverlapsLetters(box: TagBox, occupied: Set<string>): number {
  const c0 = Math.floor(box.x0);
  const c1 = Math.ceil(box.x1) - 1;
  const r0 = Math.floor(box.y0);
  const r1 = Math.ceil(box.y1) - 1;
  let hits = 0;
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (!occupied.has(cellKey(r, c))) continue;
      if (boxesOverlap(box, { x0: c, y0: r, x1: c + 1, y1: r + 1 })) hits++;
    }
  }
  return hits;
}

function tagOverlapsReserved(box: TagBox, reserved: TagBox[]): boolean {
  return reserved.some((r) => boxesOverlap(box, r));
}

/** Candidates relative to one exclusive placed tile (not the word bbox mid). */
function candidatesForAnchor(row: number, col: number): TagPlacement[] {
  const midC = col + 0.5;
  const midR = row + 0.5;
  return [
    {
      side: "above",
      anchorRow: row,
      anchorCol: col,
      cx: midC,
      cy: row - TAG_GAP,
      box: {
        x0: midC - TAG_W / 2,
        y0: row - TAG_GAP - TAG_H,
        x1: midC + TAG_W / 2,
        y1: row - TAG_GAP,
      },
    },
    {
      side: "below",
      anchorRow: row,
      anchorCol: col,
      cx: midC,
      cy: row + 1 + TAG_GAP,
      box: {
        x0: midC - TAG_W / 2,
        y0: row + 1 + TAG_GAP,
        x1: midC + TAG_W / 2,
        y1: row + 1 + TAG_GAP + TAG_H,
      },
    },
    {
      side: "left",
      anchorRow: row,
      anchorCol: col,
      cx: col - TAG_GAP,
      cy: midR,
      box: {
        x0: col - TAG_GAP - TAG_W,
        y0: midR - TAG_H / 2,
        x1: col - TAG_GAP,
        y1: midR + TAG_H / 2,
      },
    },
    {
      side: "right",
      anchorRow: row,
      anchorCol: col,
      cx: col + 1 + TAG_GAP,
      cy: midR,
      box: {
        x0: col + 1 + TAG_GAP,
        y0: midR - TAG_H / 2,
        x1: col + 1 + TAG_GAP + TAG_W,
        y1: midR + TAG_H / 2,
      },
    },
  ];
}

function minDistToOtherPlays(
  row: number,
  col: number,
  otherTiles: Set<string>,
): number {
  if (otherTiles.size === 0) return Number.POSITIVE_INFINITY;
  let best = Number.POSITIVE_INFINITY;
  for (const key of otherTiles) {
    const [or, oc] = key.split(",").map(Number);
    const d = Math.abs(or - row) + Math.abs(oc - col);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Prefer this play's own placed tiles, never a letter already claimed by
 * another tag, and favor tiles farthest from other rounds' tiles.
 */
function orderedAnchorTiles(
  play: SolutionPlayView,
  claimedAnchors: Set<string>,
  otherTiles: Set<string>,
): PlacedTile[] {
  return [...play.tiles]
    .filter((t) => !claimedAnchors.has(cellKey(t.row, t.col)))
    .sort((a, b) => {
      const da = minDistToOtherPlays(a.row, a.col, otherTiles);
      const db = minDistToOtherPlays(b.row, b.col, otherTiles);
      if (db !== da) return db - da;
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
}

function pickTagPlacement(
  play: SolutionPlayView,
  occupied: Set<string>,
  reserved: TagBox[],
  claimedAnchors: Set<string>,
  otherTiles: Set<string>,
): TagPlacement | null {
  if (play.tiles.length === 0) return null;

  const anchors = orderedAnchorTiles(play, claimedAnchors, otherTiles);
  if (anchors.length === 0) return null;

  let best: TagPlacement | null = null;
  let bestHits = Number.POSITIVE_INFINITY;

  for (const tile of anchors) {
    const candidates = candidatesForAnchor(tile.row, tile.col);
    for (const candidate of candidates) {
      if (tagOverlapsReserved(candidate.box, reserved)) continue;
      const hits = tagOverlapsLetters(candidate.box, occupied);
      if (hits === 0) return candidate;
      if (hits < bestHits) {
        bestHits = hits;
        best = candidate;
      }
    }
  }

  return best;
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
  const reserved: TagBox[] = [];
  const claimedAnchors = new Set<string>();
  const allTiles = plays.flatMap((p) =>
    p.tiles.map((t) => cellKey(t.row, t.col)),
  );

  const placed = plays.map((play, i) => {
    const own = new Set(play.tiles.map((t) => cellKey(t.row, t.col)));
    const otherTiles = new Set(allTiles.filter((k) => !own.has(k)));
    const placement = pickTagPlacement(
      play,
      occupied,
      reserved,
      claimedAnchors,
      otherTiles,
    );
    if (placement) {
      reserved.push(placement.box);
      claimedAnchors.add(cellKey(placement.anchorRow, placement.anchorCol));
    }
    return { play, i, placement };
  });

  return (
    <>
      {placed.map(({ play, i, placement }) => {
        if (!placement) return null;
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
              className="relative inline-block whitespace-nowrap px-1.5 py-0.5 font-[family-name:var(--font-display)] font-bold leading-none text-ink"
              style={{
                background: accent,
                border: `2px solid ${INK}`,
                fontSize: "0.85rem",
                letterSpacing: "0.04em",
                boxShadow: "2px 2px 0 rgba(42,51,64,0.2)",
              }}
            >
              R{play.round} · {play.score} pts
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
  const seedSet = new Set<string>(seed.map((t) => `${t.row},${t.col}`));
  const solutionMap = new Map<string, string>(
    solutionPlays.flatMap((p) =>
      p.tiles.map((t) => [`${t.row},${t.col}`, t.letter]),
    ),
  );
  const reviewSet = new Set<string>(
    reviewPlays.flatMap((p) => p.tiles.map((t) => `${t.row},${t.col}`)),
  );
  const leaderPlays = showSolution ? solutionPlays : reviewPlays;
  const highlightAccent = showSolution ? SOLUTION_ACCENT : PLAYER_ACCENT;
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

              return (
                <button
                  key={key}
                  type="button"
                  data-board-cell={`${r},${c}`}
                  onClick={() => onCellClick(r, c)}
                  onPointerDown={(e) => {
                    if (showSolution || reviewPlays.length > 0) return;
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
                        provisional={isTentative || highlighted}
                        dimmed={displayMode === "ghost"}
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
