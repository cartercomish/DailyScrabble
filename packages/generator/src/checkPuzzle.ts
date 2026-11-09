import {
  applySeed,
  createEmptyBoard,
  extractBoardWords,
  loadDictionaryFromText,
  type DailyPuzzle,
} from "@daily-rack/engine";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const date = process.argv[2] ?? "2026-11-09";
const dict = loadDictionaryFromText(
  fs.readFileSync(path.join(root, "content/words-gen.txt"), "utf8"),
);
const puzzle = JSON.parse(
  fs.readFileSync(path.join(root, "content/puzzles", `${date}.json`), "utf8"),
) as DailyPuzzle;
const words = extractBoardWords(applySeed(createEmptyBoard(puzzle.size), puzzle.seed));
const bad = words.filter((w) => !dict.has(w));
console.log(`tiles: ${puzzle.seed.length}`);
console.log(`words: ${words.join(", ")}`);
console.log(`invalid: ${bad.length ? bad.join(", ") : "(none)"}`);
console.log(
  `rounds: ${puzzle.rounds
    .map((r) => `${r.rack}→${r.bestWord.word}(${r.bestWord.score})`)
    .join(" | ")}`,
);
console.log(`par: ${puzzle.par}`);
if (bad.length) process.exitCode = 1;
