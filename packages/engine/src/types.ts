export type Premium = "DL" | "TL" | "DW" | "TW" | null;

export type Direction = "H" | "V";

export interface PlacedTile {
  letter: string;
  row: number;
  col: number;
  isBlank?: boolean;
  /** Round-2 golden crate — letter value scores double when newly placed. */
  isGold?: boolean;
}

export interface BoardCell {
  letter: string | null;
  premium: Premium;
  locked: boolean;
  gold?: boolean;
}

export interface Placement {
  row: number;
  col: number;
  direction: Direction;
  word: string;
  tilesUsed: number;
}

export interface ScoredWord {
  word: string;
  score: number;
  row: number;
  col: number;
  direction: Direction;
}

export interface PlayResult {
  ok: true;
  score: number;
  bingo: boolean;
  words: ScoredWord[];
  mainWord: string;
  tilesPlaced: PlacedTile[];
  board: BoardCell[][];
}

export interface PlayError {
  ok: false;
  error: string;
}

export type PlayOutcome = PlayResult | PlayError;

export interface BestWordInfo {
  word: string;
  score: number;
}

export interface PuzzleRound {
  rack: string;
  bestWord: BestWordInfo;
}

export interface SeedTile {
  letter: string;
  row: number;
  col: number;
}

export interface DailyPuzzle {
  id: string;
  date: string;
  number: number;
  size: number;
  seed: SeedTile[];
  rounds: PuzzleRound[];
  par: number;
  /** Known-good letter for the round-2 golden crate (same for everyone). */
  goldLetter?: string;
}

export interface RoundResult {
  score: number;
  mainWord: string;
  words: ScoredWord[];
  bingo: boolean;
  hitBestWord: boolean;
  tilesPlaced: PlacedTile[];
}

export interface GameResult {
  puzzleId: string;
  puzzleNumber: number;
  totalScore: number;
  par: number;
  delta: number;
  bestTotal: number;
  emoji: string;
  rounds: RoundResult[];
  bestWordHits: number;
}
