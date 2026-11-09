import { applyPlayFromTiles } from "./play";
import type { Dictionary, TrieNode } from "./dictionary";
import type { BoardCell, Direction, PlacedTile, PlayResult } from "./types";

export interface FoundPlay extends PlayResult {
  direction: Direction;
  startRow: number;
  startCol: number;
}

function inBounds(size: number, r: number, c: number) {
  return r >= 0 && c >= 0 && r < size && c < size;
}

/** Find all legal plays for a rack on the current board. */
export function findAllPlays(
  board: BoardCell[][],
  rack: string,
  dict: Dictionary,
  opts: { limit?: number; minScore?: number } = {},
): FoundPlay[] {
  const size = board.length;
  const results: FoundPlay[] = [];
  const rackChars = rack.toUpperCase().split("");
  const limit = opts.limit ?? 5000;

  const anchors = findAnchors(board);
  if (anchors.length === 0) {
    // Empty-ish: allow center as only anchor for first move
    const mid = Math.floor(size / 2);
    anchors.push({ row: mid, col: mid });
  }

  for (const dir of ["H", "V"] as Direction[]) {
    for (const anchor of anchors) {
      extendFromAnchor(
        board,
        dict,
        rackChars,
        anchor.row,
        anchor.col,
        dir,
        results,
        limit,
      );
      if (results.length >= limit) break;
    }
    if (results.length >= limit) break;
  }

  // Deduplicate by tile set + main word
  const seen = new Set<string>();
  const unique: FoundPlay[] = [];
  for (const play of results) {
    const key = play.tilesPlaced
      .map((t) => `${t.row},${t.col},${t.letter}`)
      .sort()
      .join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    if (opts.minScore !== undefined && play.score < opts.minScore) continue;
    unique.push(play);
  }

  unique.sort((a, b) => b.score - a.score);
  return unique;
}

function findAnchors(board: BoardCell[][]): { row: number; col: number }[] {
  const size = board.length;
  const anchors: { row: number; col: number }[] = [];
  let hasAny = false;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c].letter) {
        hasAny = true;
        continue;
      }
      const neighbors = [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];
      if (
        neighbors.some(
          ([nr, nc]) => inBounds(size, nr, nc) && board[nr][nc].letter,
        )
      ) {
        anchors.push({ row: r, col: c });
      }
    }
  }

  if (!hasAny) {
    const mid = Math.floor(size / 2);
    return [{ row: mid, col: mid }];
  }
  return anchors;
}

function extendFromAnchor(
  board: BoardCell[][],
  dict: Dictionary,
  rack: string[],
  anchorRow: number,
  anchorCol: number,
  dir: Direction,
  out: FoundPlay[],
  limit: number,
) {
  const dRow = dir === "V" ? 1 : 0;
  const dCol = dir === "H" ? 1 : 0;
  const size = board.length;

  // Scan left/up to find start limit
  let maxBefore = 0;
  let r = anchorRow - dRow;
  let c = anchorCol - dCol;
  while (inBounds(size, r, c) && !board[r][c].letter) {
    // stop if we'd pass another anchor that would duplicate — still allow
    maxBefore++;
    r -= dRow;
    c -= dCol;
    if (maxBefore > 6) break;
  }
  // If previous cell is a letter, we must start at beginning of that prefix
  const prevR = anchorRow - dRow;
  const prevC = anchorCol - dCol;
  if (inBounds(size, prevR, prevC) && board[prevR][prevC].letter) {
    maxBefore = 0;
  }

  for (let before = 0; before <= maxBefore; before++) {
    const startRow = anchorRow - before * dRow;
    const startCol = anchorCol - before * dCol;
    dfs(
      board,
      dict.getRoot(),
      dict,
      [...rack],
      startRow,
      startCol,
      dir,
      [],
      false,
      out,
      limit,
      anchorRow,
      anchorCol,
    );
    if (out.length >= limit) return;
  }
}

function dfs(
  board: BoardCell[][],
  node: TrieNode,
  dict: Dictionary,
  rack: string[],
  row: number,
  col: number,
  dir: Direction,
  placed: PlacedTile[],
  touchedAnchor: boolean,
  out: FoundPlay[],
  limit: number,
  anchorRow: number,
  anchorCol: number,
) {
  if (out.length >= limit) return;
  const size = board.length;
  if (!inBounds(size, row, col)) {
    finishIfValid(board, dict, placed, touchedAnchor, dir, out, rack.length + placed.length);
    return;
  }

  const cell = board[row][col];
  const dRow = dir === "V" ? 1 : 0;
  const dCol = dir === "H" ? 1 : 0;

  if (cell.letter) {
    const next = node.children.get(cell.letter);
    if (!next) return;
    const isAnchor = row === anchorRow && col === anchorCol;
    dfs(
      board,
      next,
      dict,
      rack,
      row + dRow,
      col + dCol,
      dir,
      placed,
      touchedAnchor || isAnchor,
      out,
      limit,
      anchorRow,
      anchorCol,
    );
    return;
  }

  // Can end word before placing if we already placed something and next would be empty start
  if (placed.length > 0 && node.terminal && touchedAnchor) {
    // Only finish if we don't leave a dangling adjacent letter in-line ahead
    const ahead = inBounds(size, row, col) && board[row][col].letter;
    if (!ahead) {
      finishIfValid(
        board,
        dict,
        placed,
        touchedAnchor,
        dir,
        out,
        rack.length + placed.length,
      );
    }
  }

  if (rack.length === 0) return;

  const tried = new Set<string>();
  for (let i = 0; i < rack.length; i++) {
    const ch = rack[i];
    if (tried.has(ch)) continue;
    tried.add(ch);
    const next = node.children.get(ch);
    if (!next) continue;

    // Cross-check
    if (!crossCheck(board, dict, row, col, ch, dir)) continue;

    const newRack = [...rack.slice(0, i), ...rack.slice(i + 1)];
    const newPlaced = [...placed, { letter: ch, row, col }];
    const isAnchor = row === anchorRow && col === anchorCol;

    dfs(
      board,
      next,
      dict,
      newRack,
      row + dRow,
      col + dCol,
      dir,
      newPlaced,
      touchedAnchor || isAnchor,
      out,
      limit,
      anchorRow,
      anchorCol,
    );
  }
}

function crossCheck(
  board: BoardCell[][],
  dict: Dictionary,
  row: number,
  col: number,
  letter: string,
  mainDir: Direction,
): boolean {
  const crossDir: Direction = mainDir === "H" ? "V" : "H";
  const dRow = crossDir === "V" ? 1 : 0;
  const dCol = crossDir === "H" ? 1 : 0;
  const size = board.length;

  // If no perpendicular neighbors, OK
  const hasPerp =
    (inBounds(size, row - dRow, col - dCol) &&
      board[row - dRow][col - dCol].letter) ||
    (inBounds(size, row + dRow, col + dCol) &&
      board[row + dRow][col + dCol].letter);
  if (!hasPerp) return true;

  // Build cross word
  let r = row;
  let c = col;
  while (inBounds(size, r - dRow, c - dCol) && board[r - dRow][c - dCol].letter) {
    r -= dRow;
    c -= dCol;
  }
  let word = "";
  let cr = r;
  let cc = c;
  while (inBounds(size, cr, cc)) {
    const ch = cr === row && cc === col ? letter : board[cr][cc].letter;
    if (!ch) break;
    word += ch;
    cr += dRow;
    cc += dCol;
  }
  return word.length < 2 || dict.has(word);
}

function finishIfValid(
  board: BoardCell[][],
  dict: Dictionary,
  placed: PlacedTile[],
  touchedAnchor: boolean,
  dir: Direction,
  out: FoundPlay[],
  originalRackLen: number,
) {
  if (!touchedAnchor || placed.length === 0) return;

  // Ensure we don't have a letter continuing past end without including it —
  // applyPlayFromTiles will validate fully
  const rackLen = Math.min(7, originalRackLen);
  const result = applyPlayFromTiles(board, placed, dict, 7);
  if (!result.ok) return;

  out.push({
    ...result,
    direction: dir,
    startRow: placed[0].row,
    startCol: placed[0].col,
  });
  void rackLen;
}

export function findBestPlay(
  board: BoardCell[][],
  rack: string,
  dict: Dictionary,
): FoundPlay | null {
  const plays = findAllPlays(board, rack, dict, { limit: 2000 });
  return plays[0] ?? null;
}
