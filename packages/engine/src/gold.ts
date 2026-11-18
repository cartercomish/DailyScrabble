import { letterValue } from "./letters";
import type { DailyPuzzle, PlacedTile } from "./types";

/** Resolve today's gold letter (stored, or derived for older puzzles). */
export function puzzleGoldLetter(puzzle: DailyPuzzle): string | null {
  if (puzzle.goldLetter) return puzzle.goldLetter.toUpperCase();
  const r2 = puzzle.rounds[1];
  if (!r2) return null;
  const rack = r2.rack.toUpperCase();
  for (const ch of r2.bestWord.word.toUpperCase()) {
    if (rack.includes(ch)) return ch;
  }
  return rack[0] ?? null;
}

/** Move one copy of letter to the front of the rack string. */
export function moveLetterToFront(rack: string, letter: string): string {
  const chars = rack.toUpperCase().split("");
  const g = letter.toUpperCase();
  const i = chars.indexOf(g);
  if (i <= 0) return chars.join("");
  chars.splice(i, 1);
  chars.unshift(g);
  return chars.join("");
}

/**
 * Seat the gold tile at the first new rack slot (index `firstNewIndex`).
 * Round 2 refresh → 0; refill → kept.length so gold is the first drawn crate.
 */
export function seatGoldTile(
  rack: string,
  goldLetter: string,
  firstNewIndex: number,
): { rack: string; goldIndex: number } {
  const g = goldLetter.toUpperCase();
  const chars = rack.toUpperCase().split("");
  if (chars.length === 0) return { rack: "", goldIndex: -1 };

  const target = Math.max(0, Math.min(firstNewIndex, chars.length - 1));
  let from = chars.findIndex((ch, i) => i >= firstNewIndex && ch === g);
  if (from === -1) from = chars.findIndex((ch) => ch === g);
  if (from === -1) {
    chars[target] = g;
    return { rack: chars.join(""), goldIndex: target };
  }
  if (from !== target) {
    const tmp = chars[target];
    chars[target] = chars[from];
    chars[from] = tmp;
  }
  return { rack: chars.join(""), goldIndex: target };
}

/** Pick a known-good gold letter from the round-2 best play's placed tiles. */
export function pickGoldLetter(
  tilesPlaced: PlacedTile[],
  rack: string,
): string {
  const rackU = rack.toUpperCase();
  const candidates = tilesPlaced
    .map((t) => t.letter.toUpperCase())
    .filter((ch) => rackU.includes(ch));
  if (candidates.length === 0) {
    return (rackU[0] ?? "A").toUpperCase();
  }
  candidates.sort(
    (a, b) => letterValue(b) - letterValue(a) || a.localeCompare(b),
  );
  return candidates[0];
}

/** Ensure puzzle has goldLetter and round-2 rack leads with it (bag-friendly). */
export function normalizePuzzleGold(puzzle: DailyPuzzle): DailyPuzzle {
  const gold = puzzleGoldLetter(puzzle);
  if (!gold || !puzzle.rounds[1]) return puzzle;
  const r2 = puzzle.rounds[1];
  const rack = moveLetterToFront(r2.rack, gold);
  if (puzzle.goldLetter === gold && r2.rack.toUpperCase() === rack) {
    return puzzle;
  }
  return {
    ...puzzle,
    goldLetter: gold,
    rounds: puzzle.rounds.map((r, i) =>
      i === 1 ? { ...r, rack } : r,
    ),
  };
}

/** Mark the first matching new tile as gold when none are flagged yet. */
export function ensureGoldOnTiles(
  tiles: PlacedTile[],
  goldLetter?: string | null,
): PlacedTile[] {
  if (!goldLetter || tiles.some((t) => t.isGold)) return tiles;
  const g = goldLetter.toUpperCase();
  let used = false;
  return tiles.map((t) => {
    if (!used && t.letter.toUpperCase() === g) {
      used = true;
      return { ...t, isGold: true };
    }
    return t;
  });
}
