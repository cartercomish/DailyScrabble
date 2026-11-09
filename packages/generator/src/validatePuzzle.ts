import {
  applySeed,
  createEmptyBoard,
  findBestPlay,
  loadDictionaryFromText,
  placeTilesOnBoard,
  type DailyPuzzle,
} from "@daily-rack/engine";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

const date = process.argv[2] ?? "2026-11-09";
const puzzlePath = path.join(repoRoot, "content/puzzles", `${date}.json`);
const puzzle = JSON.parse(fs.readFileSync(puzzlePath, "utf8")) as DailyPuzzle;
const dict = loadDictionaryFromText(
  fs.readFileSync(path.join(repoRoot, "content/words-gen.txt"), "utf8"),
);

let board = applySeed(createEmptyBoard(puzzle.size), puzzle.seed);
let total = 0;
const rounds = [];

for (let i = 0; i < puzzle.rounds.length; i++) {
  const rack = puzzle.rounds[i].rack;
  const best = findBestPlay(board, rack, dict);
  if (!best) {
    console.error(`No play for round ${i + 1} rack ${rack}`);
    process.exit(1);
  }
  console.log(
    `Round ${i + 1}: ${best.mainWord} (${best.score}) bingo=${best.bingo} tiles=${best.tilesPlaced.length}`,
  );
  console.log(
    `  tiles: ${best.tilesPlaced.map((t) => `${t.letter}@${t.row},${t.col}`).join(" ")}`,
  );
  rounds.push({
    rack,
    bestWord: { word: best.mainWord, score: best.score },
  });
  total += best.score;
  board = placeTilesOnBoard(board, best.tilesPlaced, true);
}

const updated: DailyPuzzle = {
  ...puzzle,
  rounds,
  par: Math.round(total * 0.72),
};
fs.writeFileSync(puzzlePath, JSON.stringify(updated, null, 2) + "\n");
console.log(`Total best path: ${total}, par: ${updated.par}`);
console.log(`Updated ${puzzlePath}`);
