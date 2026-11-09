import {
  applySeed,
  boardWordsAreValid,
  createEmptyBoard,
  findAllPlays,
  findBestPlay,
  letterValue,
  loadDictionaryFromText,
  placeTilesOnBoard,
  puzzleNumberForDate,
  scrambleRack,
  type BoardCell,
  type DailyPuzzle,
  type Dictionary,
  type SeedTile,
} from "@daily-rack/engine";
import fs from "fs";
import path from "path";

export interface GenOptions {
  date: string;
  seed?: number;
  size?: number;
  wordsPath?: string;
  outDir?: string;
  dryRun?: boolean;
}

export interface GenMetrics {
  seedTiles: number;
  rounds: {
    rack: string;
    playCount: number;
    playsOver20: number;
    bestScore: number;
    bestWord: string;
  }[];
  par: number;
  distinctGoodLines: number;
  accepted: boolean;
  reasons: string[];
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MIN_SEED_TILES = 14;
const MAX_SEED_TILES = 22;
const TARGET_SEED_TILES = 17;

function buildBag(dict: Dictionary): string[] {
  const anchors = [
    "PLAY", "GAME", "WORD", "TILE", "SCORE", "BOARD", "STONE", "CRANE",
    "SLATE", "POINT", "MATCH", "CROWN", "GRASP", "BLEND", "SHARP", "VOICE",
    "TRAIN", "PLANT", "HOUSE", "WATER", "LIGHT", "MUSIC", "HEART", "DREAM",
    "SHARE", "CLOCK", "TABLE", "PAPER", "GREEN", "BRICK", "CLOUD", "FIELD",
    "LETTER", "ORANGE", "SILVER", "BRIDGE", "GARDEN", "MARKET", "PLANET",
    "STREAM", "FRIEND", "CASTLE", "WINDOW", "MOTHER", "FATHER", "SUMMER",
  ];
  return anchors.filter((w) => dict.has(w));
}

const CROSS_WORDS = [
  "ARE", "ORE", "ATE", "ALE", "ONE", "USE", "ERA", "OAR", "ALL", "OLD",
  "END", "AND", "ART", "EAR", "EAT", "TEA", "SEA", "SET", "NET", "TEN",
  "REAL", "READ", "ROAD", "RAIL", "RATE", "LATE", "LINE", "LANE", "LAND",
  "LION", "LOVE", "OPEN", "OVER", "ONLY", "ONCE", "INTO", "IRON", "IDEA",
  "AREA", "ABLE", "EACH", "EAST", "EASY", "NEAR", "NAME", "NOTE", "NONE",
  "TONE", "TIME", "TEAM", "TALE", "TALK", "TREE", "TURN", "TRUE", "STAR",
  "STOP", "STEP", "SHOP", "SHIP", "SIDE", "SAID", "SAME", "SAND", "HARD",
  "HAND", "HOLD", "HOME", "HOPE", "COLD", "COME", "CARE", "CARD", "DARK",
  "DATE", "DOOR", "DOWN", "DEAL", "FIRE", "FINE", "FIND", "FARM", "FORM",
  "PART", "PARK", "PATH", "PLAN", "PLAY", "POST", "BEST", "BEAT", "BEAR",
  "BIRD", "BLUE", "BOOK", "BORN", "WARM", "WANT", "WALK", "WAVE", "WEEK",
  "YEAR", "YOUR", "YARD", "GOLD", "GONE", "GIRL", "GIVE", "GROW",
];

function tryPlaceWord(
  board: BoardCell[][],
  seed: SeedTile[],
  word: string,
  startRow: number,
  startCol: number,
  direction: "H" | "V",
  dict: Dictionary,
): boolean {
  const dRow = direction === "V" ? 1 : 0;
  const dCol = direction === "H" ? 1 : 0;
  const size = board.length;
  const extra: SeedTile[] = [];
  const trial = board.map((row) => row.map((cell) => ({ ...cell })));

  for (let i = 0; i < word.length; i++) {
    const r = startRow + i * dRow;
    const c = startCol + i * dCol;
    if (r < 0 || c < 0 || r >= size || c >= size) return false;
    const existing = trial[r][c].letter;
    if (existing && existing !== word[i]) return false;
    if (!existing) {
      extra.push({ letter: word[i], row: r, col: c });
      trial[r][c].letter = word[i];
    }
  }

  if (extra.length === 0) return false;
  if (seed.length + extra.length > MAX_SEED_TILES) return false;
  if (!boardWordsAreValid(trial, dict)) return false;

  for (const t of extra) {
    seed.push(t);
    board[t.row][t.col].letter = t.letter;
  }
  return true;
}

function placeSeedCrossword(
  size: number,
  dict: Dictionary,
  rng: () => number,
): SeedTile[] | null {
  const words = shuffle(rng, buildBag(dict));
  const board = createEmptyBoard(size);
  const mid = Math.floor(size / 2);
  const main =
    words.find((w) => w.length >= 5 && w.length <= 7) ??
    words.find((w) => w.length >= 4) ??
    "PLAY";

  const startCol = mid - Math.floor(main.length / 2);
  if (startCol < 0 || startCol + main.length > size) return null;
  const seed: SeedTile[] = [];
  for (let i = 0; i < main.length; i++) {
    seed.push({ letter: main[i], row: mid, col: startCol + i });
    board[mid][startCol + i].letter = main[i];
  }

  // Place 1–2 vertical crosses through the main word (prefer 4–5 letter commons)
  const crossSlots = shuffle(
    rng,
    [...main].map((ch, i) => ({ ch, col: startCol + i })),
  );
  let crossesPlaced = 0;
  for (const slot of crossSlots) {
    if (crossesPlaced >= 2) break;
    const crosses = shuffle(rng, CROSS_WORDS).filter(
      (w) => w.includes(slot.ch) && w.length >= 3 && w.length <= 5 && dict.has(w),
    );
    for (const cw of crosses) {
      const idx = cw.indexOf(slot.ch);
      const startRow = mid - idx;
      if (tryPlaceWord(board, seed, cw, startRow, slot.col, "V", dict)) {
        crossesPlaced++;
        break;
      }
    }
  }

  // Grow the crossword with longer common extensions until it feels substantial
  const growRacks = shuffle(rng, [
    "AEINRST",
    "AELORST",
    "ADEINRT",
    "AELNRST",
    "AEIORST",
  ]);
  let guard = 0;
  let stuck = 0;
  while (seed.length < TARGET_SEED_TILES && guard < 24) {
    guard++;
    const current = applySeed(createEmptyBoard(size), seed);
    const rack = growRacks[guard % growRacks.length];
    const plays = findAllPlays(current, rack, dict, { limit: 180 });
    const extensions = plays
      .filter((p) => {
        const nextCount = seed.length + p.tilesPlaced.length;
        if (p.tilesPlaced.length < 2 || p.tilesPlaced.length > 5) return false;
        if (nextCount > MAX_SEED_TILES) return false;
        if (!dict.has(p.mainWord) || p.mainWord.length < 3) return false;
        if (p.words.some((w) => !dict.has(w.word))) return false;
        const trial = placeTilesOnBoard(current, p.tilesPlaced, true);
        return boardWordsAreValid(trial, dict);
      })
      .sort((a, b) => {
        // Prefer longer words / more new tiles so boards feel meaty
        const score =
          b.mainWord.length * 3 +
          b.tilesPlaced.length * 2 -
          (a.mainWord.length * 3 + a.tilesPlaced.length * 2);
        return score;
      });

    if (!extensions.length) {
      stuck++;
      if (stuck >= 4) break;
      continue;
    }
    stuck = 0;
    const pickFrom = extensions.slice(0, Math.min(18, extensions.length));
    const p = pick(rng, pickFrom);
    for (const t of p.tilesPlaced) {
      seed.push({ letter: t.letter, row: t.row, col: t.col });
      board[t.row][t.col].letter = t.letter;
    }
  }

  const finalBoard = applySeed(createEmptyBoard(size), seed);
  if (seed.length < MIN_SEED_TILES || seed.length > MAX_SEED_TILES) return null;
  if (!boardWordsAreValid(finalBoard, dict)) return null;
  return seed;
}

function drawRack(rng: () => number, bag: string[]): string {
  const rack: string[] = [];
  for (let i = 0; i < 7; i++) {
    if (bag.length === 0) break;
    const idx = Math.floor(rng() * bag.length);
    rack.push(bag.splice(idx, 1)[0]);
  }
  return rack.join("");
}

function makeBag(): string[] {
  const counts: Record<string, number> = {
    A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1,
    L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2,
    W: 2, X: 1, Y: 2, Z: 1,
  };
  const bag: string[] = [];
  for (const [ch, n] of Object.entries(counts)) {
    for (let i = 0; i < n; i++) bag.push(ch);
  }
  return bag;
}

function evaluateAcceptance(
  board: BoardCell[],
  // placeholder signature fix below
): void {
  void board;
}

export function generatePuzzle(
  dict: Dictionary,
  options: GenOptions,
): { puzzle: DailyPuzzle; metrics: GenMetrics } | null {
  const size = options.size ?? 11;
  const rng = mulberry32(options.seed ?? hashDate(options.date));
  const reasons: string[] = [];

  let seed: SeedTile[] | null = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    seed = placeSeedCrossword(size, dict, rng);
    if (seed) break;
  }
  if (!seed) {
    return null;
  }

  let board = applySeed(createEmptyBoard(size), seed);
  const bag = shuffle(rng, makeBag());
  // Remove seed letters from bag roughly
  for (const t of seed) {
    const idx = bag.indexOf(t.letter);
    if (idx !== -1) bag.splice(idx, 1);
  }

  const roundData: DailyPuzzle["rounds"] = [];
  const roundMetrics: GenMetrics["rounds"] = [];
  let totalBest = 0;
  const lineScores: number[] = [];

  for (let round = 0; round < 3; round++) {
    let rack = "";
    let plays = findAllPlays(board, "", dict, { limit: 1 });
    let acceptedRound = false;

    for (let tryRack = 0; tryRack < 60; tryRack++) {
      const bagCopy = [...bag];
      rack = drawRack(rng, bagCopy);
      // Bias toward playable racks: ensure 2+ vowels
      const vowels = rack.split("").filter((c) => "AEIOU".includes(c)).length;
      if (vowels < 2) continue;

      plays = findAllPlays(board, rack, dict, { limit: 400 });
      const over20 = plays.filter((p) => p.score >= 20).length;
      const best = plays[0];
      if (
        plays.length >= 15 &&
        over20 >= 2 &&
        best &&
        (best.score >= 18 || plays.length >= 25)
      ) {
        // commit bag draw
        for (const ch of rack) {
          const idx = bag.indexOf(ch);
          if (idx !== -1) bag.splice(idx, 1);
        }
        const displayRack = scrambleRack(rack, [best.mainWord, rack], rng);
        roundData.push({
          rack: displayRack,
          bestWord: { word: best.mainWord, score: best.score },
        });
        roundMetrics.push({
          rack: displayRack,
          playCount: plays.length,
          playsOver20: over20,
          bestScore: best.score,
          bestWord: best.mainWord,
        });
        totalBest += best.score;
        // Advance board along canonical best path
        board = placeTilesOnBoard(board, best.tilesPlaced, true);
        acceptedRound = true;
        break;
      }
    }

    if (!acceptedRound) {
      reasons.push(`Round ${round + 1} failed playability gates`);
      // still try to salvage with whatever
      rack = drawRack(rng, bag);
      const best = findBestPlay(board, rack, dict);
      if (!best) {
        reasons.push(`Round ${round + 1} has no legal plays`);
        return null;
      }
      const displayRack = scrambleRack(rack, [best.mainWord, rack], rng);
      roundData.push({
        rack: displayRack,
        bestWord: { word: best.mainWord, score: best.score },
      });
      roundMetrics.push({
        rack: displayRack,
        playCount: 1,
        playsOver20: best.score >= 20 ? 1 : 0,
        bestScore: best.score,
        bestWord: best.mainWord,
      });
      totalBest += best.score;
      board = placeTilesOnBoard(board, best.tilesPlaced, true);
    }

    // Sample alternate lines for entropy estimate (first round only branching)
  }

  // Entropy: branch on round-1 alternatives, then greedy best for later racks
  {
    const alts = findAllPlays(
      applySeed(createEmptyBoard(size), seed),
      roundData[0].rack,
      dict,
      { limit: 40 },
    );
    for (const alt of alts.slice(0, 6)) {
      let b = placeTilesOnBoard(
        applySeed(createEmptyBoard(size), seed),
        alt.tilesPlaced,
        true,
      );
      let sum = alt.score;
      for (let r = 1; r < 3; r++) {
        const bp = findBestPlay(b, roundData[r].rack, dict);
        if (!bp) break;
        sum += bp.score;
        b = placeTilesOnBoard(b, bp.tilesPlaced, true);
      }
      lineScores.push(sum);
    }
  }

  const par = Math.round(totalBest * 0.65);
  const bestTotal = Math.max(...lineScores, totalBest);
  const goodLines = lineScores.filter((s) => s >= bestTotal * 0.85).length;

  if (seed.length < MIN_SEED_TILES || seed.length > MAX_SEED_TILES) {
    reasons.push(`Seed tile count ${seed.length} out of range`);
  }
  for (const m of roundMetrics) {
    if (m.playCount < 10) reasons.push(`Rack ${m.rack} only ${m.playCount} plays`);
  }

  const accepted =
    reasons.length === 0 &&
    roundMetrics.every((m) => m.playCount >= 20 && m.bestScore >= 18);

  const puzzle: DailyPuzzle = {
    id: options.date,
    date: options.date,
    number: puzzleNumberForDate(options.date),
    size,
    seed,
    rounds: roundData,
    par,
  };

  void evaluateAcceptance;
  void letterValue;
  void goodLines;

  return {
    puzzle,
    metrics: {
      seedTiles: seed.length,
      rounds: roundMetrics,
      par,
      distinctGoodLines: Math.max(goodLines, 1),
      accepted,
      reasons,
    },
  };
}

function hashDate(date: string): number {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Generation dictionary: smaller everyday list used for seeds + par/best marks. */
export function loadDictFromRepo(wordsPath?: string): Dictionary {
  const p =
    wordsPath ??
    path.resolve(process.cwd(), "../../content/words-gen.txt");
  const alt = path.resolve(process.cwd(), "content/words-gen.txt");
  const legacy = path.resolve(process.cwd(), "content/words.txt");
  const file = fs.existsSync(p) ? p : fs.existsSync(alt) ? alt : legacy;
  const text = fs.readFileSync(file, "utf8");
  return loadDictionaryFromText(text);
}

export function writePuzzle(puzzle: DailyPuzzle, outDir: string) {
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${puzzle.date}.json`);
  fs.writeFileSync(file, JSON.stringify(puzzle, null, 2) + "\n");
  return file;
}
