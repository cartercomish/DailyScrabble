import type { BoardCell } from "./types";
import type { Dictionary } from "./dictionary";

/** Collect every horizontal/vertical run of 2+ letters on the board. */
export function extractBoardWords(board: BoardCell[][]): string[] {
  const words: string[] = [];
  const size = board.length;

  for (let r = 0; r < size; r++) {
    let c = 0;
    while (c < size) {
      if (!board[r][c].letter) {
        c++;
        continue;
      }
      let word = "";
      const start = c;
      while (c < size && board[r][c].letter) {
        word += board[r][c].letter!;
        c++;
      }
      if (word.length >= 2) words.push(word);
      if (c === start) c++;
    }
  }

  for (let c = 0; c < size; c++) {
    let r = 0;
    while (r < size) {
      if (!board[r][c].letter) {
        r++;
        continue;
      }
      let word = "";
      const start = r;
      while (r < size && board[r][c].letter) {
        word += board[r][c].letter!;
        r++;
      }
      if (word.length >= 2) words.push(word);
      if (r === start) r++;
    }
  }

  return words;
}

export function invalidBoardWords(
  board: BoardCell[][],
  dict: Dictionary,
): string[] {
  return extractBoardWords(board).filter((w) => !dict.has(w));
}

export function boardWordsAreValid(
  board: BoardCell[][],
  dict: Dictionary,
): boolean {
  return invalidBoardWords(board, dict).length === 0;
}
