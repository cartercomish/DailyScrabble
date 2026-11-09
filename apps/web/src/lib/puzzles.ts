import type { DailyPuzzle } from "@daily-rack/engine";
import { getPuzzleDate } from "@daily-rack/engine";
import fs from "fs";
import path from "path";

function puzzlesDir() {
  return path.join(process.cwd(), "../../content/puzzles");
}

export function loadPuzzleByDate(date: string): DailyPuzzle | null {
  const file = path.join(puzzlesDir(), `${date}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as DailyPuzzle;
}

export function loadTodayPuzzle(): DailyPuzzle {
  const today = getPuzzleDate();
  const exact = loadPuzzleByDate(today);
  if (exact) return exact;

  // Fallback: most recent available puzzle (dev / ahead-of-queue)
  const dir = puzzlesDir();
  if (!fs.existsSync(dir)) {
    throw new Error("No puzzles directory found");
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  if (files.length === 0) throw new Error("No puzzles available");
  const latest = files[files.length - 1];
  return JSON.parse(
    fs.readFileSync(path.join(dir, latest), "utf8"),
  ) as DailyPuzzle;
}

export function listPuzzleDates(): string[] {
  const dir = puzzlesDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}
