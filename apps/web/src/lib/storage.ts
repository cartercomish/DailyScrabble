import type { GameResult, PlacedTile, RoundResult } from "@daily-rack/engine";

const STREAK_KEY = "manifest-streak";
const PROGRESS_PREFIX = "manifest-progress:";
const RACK_MODE_KEY = "manifest-rack-mode";

export type RackMode = "refresh" | "refill";

export interface StreakState {
  count: number;
  lastPuzzleId: string | null;
}

export type TentativeTile = PlacedTile & { rackIndex: number };

export interface DayProgress {
  puzzleId: string;
  roundIndex: number;
  boardLetters: (string | null)[][];
  roundResults: RoundResult[];
  tentative: TentativeTile[];
  rackOrder: string;
  bagIndex?: number;
  finished: boolean;
  result?: GameResult;
}

export function loadRackMode(): RackMode {
  if (typeof window === "undefined") return "refill";
  try {
    const raw = localStorage.getItem(RACK_MODE_KEY);
    return raw === "refresh" ? "refresh" : "refill";
  } catch {
    return "refill";
  }
}

export function saveRackMode(mode: RackMode) {
  localStorage.setItem(RACK_MODE_KEY, mode);
}

/** Restore older saves that only stored letter/row/col. */
export function normalizeTentative(
  tiles: Array<PlacedTile & { rackIndex?: number }>,
  rackOrder: string,
): TentativeTile[] {
  const taken = new Set<number>();
  const letters = rackOrder.toUpperCase().split("");
  return tiles.map((t) => {
    if (typeof t.rackIndex === "number" && t.rackIndex >= 0) {
      taken.add(t.rackIndex);
      return {
        letter: t.letter.toUpperCase(),
        row: t.row,
        col: t.col,
        rackIndex: t.rackIndex,
      };
    }
    const idx = letters.findIndex(
      (l, i) => l === t.letter.toUpperCase() && !taken.has(i),
    );
    if (idx !== -1) taken.add(idx);
    return {
      letter: t.letter.toUpperCase(),
      row: t.row,
      col: t.col,
      rackIndex: idx,
    };
  });
}

export function loadStreak(): StreakState {
  if (typeof window === "undefined") return { count: 0, lastPuzzleId: null };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { count: 0, lastPuzzleId: null };
    return JSON.parse(raw) as StreakState;
  } catch {
    return { count: 0, lastPuzzleId: null };
  }
}

export function saveStreak(state: StreakState) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(state));
}

export function updateStreakOnFinish(puzzleId: string, date: string): number {
  const streak = loadStreak();
  if (streak.lastPuzzleId === puzzleId) return streak.count;

  const yesterday = adjacentDate(date, -1);
  const count =
    streak.lastPuzzleId && streak.lastPuzzleId === yesterday
      ? streak.count + 1
      : 1;

  saveStreak({ count, lastPuzzleId: puzzleId });
  return count;
}

function adjacentDate(date: string, delta: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

export function loadProgress(puzzleId: string): DayProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROGRESS_PREFIX + puzzleId);
    if (!raw) return null;
    return JSON.parse(raw) as DayProgress;
  } catch {
    return null;
  }
}

export function saveProgress(progress: DayProgress) {
  localStorage.setItem(
    PROGRESS_PREFIX + progress.puzzleId,
    JSON.stringify(progress),
  );
}
