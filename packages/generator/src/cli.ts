import path from "path";
import { fileURLToPath } from "url";
import { generatePuzzle, loadDictFromRepo, writePuzzle } from "./generate";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

function parseArgs(argv: string[]) {
  const opts: {
    date?: string;
    seed?: number;
    batch?: number;
    size?: number;
    dryRun?: boolean;
  } = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--date") opts.date = argv[++i];
    else if (a === "--seed") opts.seed = Number(argv[++i]);
    else if (a === "--batch") opts.batch = Number(argv[++i]);
    else if (a === "--size") opts.size = Number(argv[++i]);
    else if (a === "--dry-run") opts.dryRun = true;
  }
  return opts;
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  console.log("Loading dictionary…");
  const dict = loadDictFromRepo(path.join(repoRoot, "content/words-gen.txt"));
  console.log(`Gen dictionary: ${dict.size} words`);

  const outDir = path.join(repoRoot, "content/puzzles");
  const start = opts.date ?? new Date().toISOString().slice(0, 10);
  const count = opts.batch ?? 1;

  for (let i = 0; i < count; i++) {
    const date = addDays(start, i);
    console.log(`\nGenerating ${date}…`);
    let result = null;
    for (let attempt = 0; attempt < 24; attempt++) {
      result = generatePuzzle(dict, {
        date,
        seed: (opts.seed ?? 0) + i * 1000 + attempt * 17,
        size: opts.size ?? 11,
      });
      if (
        result &&
        result.metrics.accepted &&
        result.metrics.seedTiles >= 14
      ) {
        break;
      }
      if (result) {
        console.log(
          `  attempt ${attempt + 1}: soft-fail (${result.metrics.reasons.join("; ") || "gates"})`,
        );
      }
    }

    if (!result) {
      console.error(`Failed to generate ${date}`);
      process.exitCode = 1;
      continue;
    }

    const { puzzle, metrics } = result;
    console.log(`  seed tiles: ${metrics.seedTiles}`);
    for (const r of metrics.rounds) {
      console.log(
        `  rack ${r.rack}: ${r.playCount} plays, ${r.playsOver20}≥20, best ${r.bestWord} (${r.bestScore})`,
      );
    }
    console.log(`  par: ${metrics.par}  goodLines≈${metrics.distinctGoodLines}`);
    console.log(`  accepted: ${metrics.accepted}`);

    if (!opts.dryRun) {
      const file = writePuzzle(puzzle, outDir);
      console.log(`  wrote ${file}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
