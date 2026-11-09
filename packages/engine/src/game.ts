import { applySeed, createEmptyBoard, placeTilesOnBoard } from "./board";
import type { Dictionary } from "./dictionary";
import { commitTentative } from "./play";
import { puzzleBestTotal, scoreEmoji } from "./rating";
import type {
  BoardCell,
  DailyPuzzle,
  GameResult,
  PlacedTile,
  RoundResult,
} from "./types";

export function boardFromPuzzle(puzzle: DailyPuzzle): BoardCell[][] {
  const board = createEmptyBoard(puzzle.size);
  return applySeed(board, puzzle.seed);
}

export function evaluateRound(
  board: BoardCell[][],
  tiles: PlacedTile[],
  dict: Dictionary,
  bestWord: { word: string; score: number },
): { result: RoundResult; board: BoardCell[][] } | { error: string } {
  const outcome = commitTentative(board, tiles, dict, 7);
  if (!outcome.ok) return { error: outcome.error };

  const target = bestWord.word.toUpperCase();
  const hitBestWord =
    outcome.mainWord === target ||
    outcome.words.some((w) => w.word === target);

  const round: RoundResult = {
    score: outcome.score,
    mainWord: outcome.mainWord,
    words: outcome.words,
    bingo: outcome.bingo,
    hitBestWord,
    tilesPlaced: outcome.tilesPlaced,
  };

  return {
    result: round,
    board: placeTilesOnBoard(board, outcome.tilesPlaced, true),
  };
}

export function buildGameResult(
  puzzle: DailyPuzzle,
  rounds: RoundResult[],
): GameResult {
  const totalScore = rounds.reduce((s, r) => s + r.score, 0);
  const bestTotal = puzzleBestTotal(puzzle);
  return {
    puzzleId: puzzle.id,
    puzzleNumber: puzzle.number,
    totalScore,
    par: puzzle.par,
    delta: totalScore - puzzle.par,
    bestTotal,
    emoji: scoreEmoji(totalScore, bestTotal),
    rounds,
    bestWordHits: rounds.filter((r) => r.hitBestWord).length,
  };
}

export function remainingRack(rack: string, placed: PlacedTile[]): string {
  const letters = rack.toUpperCase().split("");
  for (const t of placed) {
    const idx = letters.indexOf(t.letter.toUpperCase());
    if (idx !== -1) letters.splice(idx, 1);
  }
  return letters.join("");
}

/** Later-round racks concatenated as a deterministic draw pile for refill mode. */
export function puzzleRefillBag(puzzle: DailyPuzzle): string {
  return puzzle.rounds
    .slice(1)
    .map((r) => r.rack.toUpperCase())
    .join("");
}

/** Keep unused tiles and draw from the front of the bag until rack is full. */
export function refillRack(
  kept: string,
  bag: string,
  bagIndex: number,
  size = 7,
): { rack: string; nextBagIndex: number; drawn: string } {
  const need = Math.max(0, size - kept.length);
  const drawn = bag.slice(bagIndex, bagIndex + need);
  return {
    rack: (kept + drawn).toUpperCase(),
    nextBagIndex: bagIndex + drawn.length,
    drawn,
  };
}

export function shuffleRack(rack: string, rng = Math.random): string {
  const arr = rack.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

/** Shuffle rack letters so they don't literally spell a known best word. */
export function scrambleRack(
  rack: string,
  avoidWords: string[] = [],
  rng = Math.random,
): string {
  const normalized = rack.toUpperCase();
  const avoid = new Set(avoidWords.map((w) => w.toUpperCase()));
  let best = shuffleRack(normalized, rng);
  for (let i = 0; i < 24; i++) {
    const candidate = shuffleRack(normalized, rng);
    if (!avoid.has(candidate) && candidate !== normalized) return candidate;
    best = candidate;
  }
  // Last resort: rotate if still identical to an avoid word
  if (avoid.has(best) && best.length > 1) {
    return best.slice(1) + best[0];
  }
  return best;
}
