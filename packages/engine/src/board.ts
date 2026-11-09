import { createPremiumGrid } from "./boardLayout";
import type { BoardCell, PlacedTile, SeedTile } from "./types";

export function createEmptyBoard(size: number): BoardCell[][] {
  const premiums = createPremiumGrid(size);
  return premiums.map((row) =>
    row.map((premium) => ({
      letter: null,
      premium,
      locked: false,
    })),
  );
}

export function cloneBoard(board: BoardCell[][]): BoardCell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function applySeed(board: BoardCell[][], seed: SeedTile[]): BoardCell[][] {
  const next = cloneBoard(board);
  for (const t of seed) {
    const letter = t.letter.toUpperCase();
    next[t.row][t.col] = {
      ...next[t.row][t.col],
      letter,
      locked: true,
    };
  }
  return next;
}

export function boardHasTiles(board: BoardCell[][]): boolean {
  return board.some((row) => row.some((c) => c.letter !== null));
}

export function centerOf(size: number): { row: number; col: number } {
  const mid = Math.floor(size / 2);
  return { row: mid, col: mid };
}

export function placeTilesOnBoard(
  board: BoardCell[][],
  tiles: PlacedTile[],
  lock = true,
): BoardCell[][] {
  const next = cloneBoard(board);
  for (const t of tiles) {
    next[t.row][t.col] = {
      ...next[t.row][t.col],
      letter: t.letter.toUpperCase(),
      locked: lock,
    };
  }
  return next;
}

export function serializeBoard(board: BoardCell[][]): (string | null)[][] {
  return board.map((row) => row.map((c) => c.letter));
}
