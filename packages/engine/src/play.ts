import { cloneBoard, boardHasTiles, centerOf } from "./board";
import type { Dictionary } from "./dictionary";
import { letterValue } from "./letters";
import type {
  BoardCell,
  Direction,
  Placement,
  PlacedTile,
  PlayOutcome,
  ScoredWord,
} from "./types";

function inBounds(board: BoardCell[][], row: number, col: number) {
  return row >= 0 && col >= 0 && row < board.length && col < board.length;
}

function getCell(board: BoardCell[][], row: number, col: number) {
  return inBounds(board, row, col) ? board[row][col] : null;
}

/** Expand a placement into newly placed tiles + resulting board preview. */
export function expandPlacement(
  board: BoardCell[][],
  placement: Placement,
  rack: string,
): { tiles: PlacedTile[]; error?: string } {
  const tiles: PlacedTile[] = [];
  const rackLetters = rack.toUpperCase().split("");
  const word = placement.word.toUpperCase();
  const dRow = placement.direction === "V" ? 1 : 0;
  const dCol = placement.direction === "H" ? 1 : 0;

  for (let i = 0; i < word.length; i++) {
    const row = placement.row + i * dRow;
    const col = placement.col + i * dCol;
    if (!inBounds(board, row, col)) {
      return { tiles: [], error: "Word goes off the board" };
    }
    const cell = board[row][col];
    const ch = word[i];
    if (cell.letter) {
      if (cell.letter !== ch) {
        return { tiles: [], error: `Conflicts with existing tile at ${row},${col}` };
      }
      continue;
    }
    const idx = rackLetters.indexOf(ch);
    if (idx === -1) {
      return { tiles: [], error: `Letter ${ch} not in rack` };
    }
    rackLetters.splice(idx, 1);
    tiles.push({ letter: ch, row, col });
  }

  if (tiles.length === 0) {
    return { tiles: [], error: "Must place at least one new tile" };
  }

  return { tiles };
}

function tilesContiguousAndAligned(tiles: PlacedTile[]): {
  ok: boolean;
  direction?: Direction;
  error?: string;
} {
  if (tiles.length === 0) return { ok: false, error: "No tiles" };
  if (tiles.length === 1) return { ok: true };

  const rows = new Set(tiles.map((t) => t.row));
  const cols = new Set(tiles.map((t) => t.col));

  if (rows.size === 1) {
    const row = tiles[0].row;
    const sorted = [...tiles].sort((a, b) => a.col - b.col);
    // gaps filled by existing tiles checked later
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].col === sorted[i - 1].col) {
        return { ok: false, error: "Tiles overlap" };
      }
    }
    void row;
    return { ok: true, direction: "H" };
  }

  if (cols.size === 1) {
    const sorted = [...tiles].sort((a, b) => a.row - b.row);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].row === sorted[i - 1].row) {
        return { ok: false, error: "Tiles overlap" };
      }
    }
    return { ok: true, direction: "V" };
  }

  return { ok: false, error: "Tiles must be in a single row or column" };
}

function readWordThrough(
  board: BoardCell[][],
  row: number,
  col: number,
  direction: Direction,
): { word: string; startRow: number; startCol: number } {
  const dRow = direction === "V" ? 1 : 0;
  const dCol = direction === "H" ? 1 : 0;

  let r = row;
  let c = col;
  while (true) {
    const prev = getCell(board, r - dRow, c - dCol);
    if (!prev?.letter) break;
    r -= dRow;
    c -= dCol;
  }

  const startRow = r;
  const startCol = c;
  let word = "";
  while (getCell(board, r, c)?.letter) {
    word += board[r][c].letter!;
    r += dRow;
    c += dCol;
  }
  return { word, startRow, startCol };
}

function wordIsConnected(
  boardBefore: BoardCell[][],
  tiles: PlacedTile[],
): boolean {
  if (!boardHasTiles(boardBefore)) {
    const center = centerOf(boardBefore.length);
    return tiles.some((t) => t.row === center.row && t.col === center.col);
  }

  for (const t of tiles) {
    const neighbors = [
      [t.row - 1, t.col],
      [t.row + 1, t.col],
      [t.row, t.col - 1],
      [t.row, t.col + 1],
    ];
    for (const [nr, nc] of neighbors) {
      const cell = getCell(boardBefore, nr, nc);
      if (cell?.letter) return true;
    }
  }
  return false;
}

function noGapsInMainLine(
  board: BoardCell[][],
  tiles: PlacedTile[],
  direction: Direction | undefined,
): boolean {
  if (tiles.length <= 1) return true;
  if (!direction) return true;

  if (direction === "H") {
    const row = tiles[0].row;
    const cols = tiles.map((t) => t.col).sort((a, b) => a - b);
    for (let c = cols[0]; c <= cols[cols.length - 1]; c++) {
      if (!board[row][c].letter) return false;
    }
  } else {
    const col = tiles[0].col;
    const rows = tiles.map((t) => t.row).sort((a, b) => a - b);
    for (let r = rows[0]; r <= rows[rows.length - 1]; r++) {
      if (!board[r][col].letter) return false;
    }
  }
  return true;
}

function scoreWordOnBoard(
  boardBefore: BoardCell[][],
  boardAfter: BoardCell[][],
  startRow: number,
  startCol: number,
  direction: Direction,
  newTileKeys: Set<string>,
): ScoredWord {
  const dRow = direction === "V" ? 1 : 0;
  const dCol = direction === "H" ? 1 : 0;
  let r = startRow;
  let c = startCol;
  let word = "";
  let letterScore = 0;
  let wordMult = 1;

  while (getCell(boardAfter, r, c)?.letter) {
    const letter = boardAfter[r][c].letter!;
    word += letter;
    const key = `${r},${c}`;
    const isNew = newTileKeys.has(key);
    const premium = isNew ? boardBefore[r][c].premium : null;
    let lv = letterValue(letter);
    if (premium === "DL") lv *= 2;
    if (premium === "TL") lv *= 3;
    letterScore += lv;
    if (premium === "DW") wordMult *= 2;
    if (premium === "TW") wordMult *= 3;
    r += dRow;
    c += dCol;
  }

  return {
    word,
    score: letterScore * wordMult,
    row: startRow,
    col: startCol,
    direction,
  };
}

export function applyPlayFromTiles(
  board: BoardCell[][],
  tiles: PlacedTile[],
  dict: Dictionary,
  rackLength: number,
): PlayOutcome {
  if (tiles.length === 0) {
    return { ok: false, error: "Place at least one tile" };
  }

  // Occupied check
  for (const t of tiles) {
    if (!inBounds(board, t.row, t.col)) {
      return { ok: false, error: "Tile out of bounds" };
    }
    if (board[t.row][t.col].letter) {
      return { ok: false, error: "Cell already occupied" };
    }
  }

  const aligned = tilesContiguousAndAligned(tiles);
  if (!aligned.ok) return { ok: false, error: aligned.error ?? "Invalid placement" };

  if (!wordIsConnected(board, tiles)) {
    return {
      ok: false,
      error: boardHasTiles(board)
        ? "Play must connect to existing tiles"
        : "First play must cover the center star",
    };
  }

  const boardAfter = cloneBoard(board);
  const newTileKeys = new Set<string>();
  for (const t of tiles) {
    boardAfter[t.row][t.col] = {
      ...boardAfter[t.row][t.col],
      letter: t.letter.toUpperCase(),
      locked: true,
    };
    newTileKeys.add(`${t.row},${t.col}`);
  }

  if (!noGapsInMainLine(boardAfter, tiles, aligned.direction)) {
    return { ok: false, error: "Tiles must form a continuous word" };
  }

  // Determine main word direction
  let mainDir: Direction = aligned.direction ?? "H";
  if (tiles.length === 1) {
    const t = tiles[0];
    const horiz = readWordThrough(boardAfter, t.row, t.col, "H");
    const vert = readWordThrough(boardAfter, t.row, t.col, "V");
    if (horiz.word.length >= 2 && vert.word.length >= 2) {
      // both cross — pick longer, or H by default; both will be scored
      mainDir = horiz.word.length >= vert.word.length ? "H" : "V";
    } else if (vert.word.length >= 2) {
      mainDir = "V";
    } else {
      mainDir = "H";
    }
  }

  const main = readWordThrough(
    boardAfter,
    tiles[0].row,
    tiles[0].col,
    mainDir,
  );
  if (main.word.length < 2) {
    return { ok: false, error: "Play must form a word of at least 2 letters" };
  }

  const scoredWords: ScoredWord[] = [];
  const mainScored = scoreWordOnBoard(
    board,
    boardAfter,
    main.startRow,
    main.startCol,
    mainDir,
    newTileKeys,
  );
  scoredWords.push(mainScored);

  // Cross words for each new tile
  const crossDir: Direction = mainDir === "H" ? "V" : "H";
  for (const t of tiles) {
    const cross = readWordThrough(boardAfter, t.row, t.col, crossDir);
    if (cross.word.length >= 2) {
      // avoid duplicating main if somehow same
      if (
        !(
          cross.startRow === main.startRow &&
          cross.startCol === main.startCol &&
          crossDir === mainDir
        )
      ) {
        scoredWords.push(
          scoreWordOnBoard(
            board,
            boardAfter,
            cross.startRow,
            cross.startCol,
            crossDir,
            newTileKeys,
          ),
        );
      }
    }
  }

  // Deduplicate by position+direction
  const uniq = new Map<string, ScoredWord>();
  for (const w of scoredWords) {
    uniq.set(`${w.row},${w.col},${w.direction}`, w);
  }
  const words = [...uniq.values()];

  for (const w of words) {
    if (!dict.has(w.word)) {
      return { ok: false, error: `"${w.word}" is not a valid word` };
    }
  }

  const bingo = tiles.length === rackLength && rackLength === 7;
  let score = words.reduce((s, w) => s + w.score, 0);
  if (bingo) score += 50;

  return {
    ok: true,
    score,
    bingo,
    words,
    mainWord: mainScored.word,
    tilesPlaced: tiles.map((t) => ({
      ...t,
      letter: t.letter.toUpperCase(),
    })),
    board: boardAfter,
  };
}

export function applyPlacement(
  board: BoardCell[][],
  placement: Placement,
  rack: string,
  dict: Dictionary,
): PlayOutcome {
  const expanded = expandPlacement(board, placement, rack);
  if (expanded.error) return { ok: false, error: expanded.error };
  return applyPlayFromTiles(board, expanded.tiles, dict, rack.length);
}

/** Convert tentative board placements (from UI) into a play. */
export function commitTentative(
  board: BoardCell[][],
  tentative: PlacedTile[],
  dict: Dictionary,
  rackSize = 7,
): PlayOutcome {
  return applyPlayFromTiles(board, tentative, dict, rackSize);
}
