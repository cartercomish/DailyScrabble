/**
 * Builds daily puzzles with dense, common-word seeds.
 * Usage:
 *   pnpm craft           -> regenerate today + epoch via denser generator
 *   pnpm craft -- gen    -> same (alias)
 */
import { loadDictionaryFromText } from "@daily-rack/engine";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generatePuzzle, writePuzzle } from "./generate";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const dict = loadDictionaryFromText(
  fs.readFileSync(path.join(repoRoot, "content/words-gen.txt"), "utf8"),
);

const outDir = path.join(repoRoot, "content/puzzles");

const dates = [
  "2026-04-12",
  "2026-11-09",
  "2026-11-10",
  "2026-11-11",
  "2026-11-12",
  "2026-11-13",
  "2026-11-14",
  "2026-11-15",
  "2026-11-16",
];

async function main() {
  console.log(`Gen dictionary: ${dict.size} words`);
  console.log("Target seed size: 14–22 tiles\n");

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    let result = null;
    for (let attempt = 0; attempt < 28; attempt++) {
      result = generatePuzzle(dict, {
        date,
        seed: 22000 + i * 199 + attempt * 23,
      });
      if (
        result?.metrics.accepted &&
        result.metrics.seedTiles >= 14 &&
        result.metrics.rounds.every((r) => r.playCount >= 15)
      ) {
        break;
      }
      if (result) {
        console.log(
          `  ${date} attempt ${attempt + 1}: ${result.metrics.seedTiles} tiles, accepted=${result.metrics.accepted}`,
        );
      }
      result = null;
    }

    if (!result) {
      console.error(`Failed to generate ${date}`);
      process.exitCode = 1;
      continue;
    }

    writePuzzle(result.puzzle, outDir);
    console.log(
      `✓ ${date}: ${result.metrics.seedTiles} tiles · par ${result.metrics.par} · ${result.puzzle.rounds
        .map((r) => `${r.rack}→${r.bestWord.word}`)
        .join(" · ")}`,
    );
  }
}

main();
