"use client";

import {
  boardFromPuzzle,
  buildGameResult,
  cloneBoard,
  evaluateRound,
  findBestSolutionPath,
  puzzleGoldLetter,
  puzzleRefillBag,
  refillRack,
  remainingRack,
  seatGoldTile,
  serializeBoard,
  type BoardCell,
  type DailyPuzzle,
  type GameResult,
  type RoundResult,
} from "@daily-rack/engine";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadProgress,
  loadRackMode,
  loadStreak,
  normalizeTentative,
  saveProgress,
  updateStreakOnFinish,
  type DayProgress,
  type RackMode,
  type TentativeTile,
} from "../lib/storage";
import { useDictionary } from "../lib/useDictionary";
import {
  useTileDrag,
  type DragSource,
  type DropTarget,
} from "../lib/useTileDrag";
import { Board, type SolutionPlayView } from "./Board";
import { CargoShipMark, DockScene } from "./DockScene";
import { DragGhost } from "./DragGhost";
import { HowToPlay } from "./HowToPlay";
import { Results } from "./Results";
import { Rack } from "./Rack";

interface GameClientProps {
  puzzle: DailyPuzzle;
}

function progressMatchesSeed(
  progress: DayProgress,
  puzzle: DailyPuzzle,
): boolean {
  if (!progress.boardLetters?.length) return false;
  return puzzle.seed.every((t) => {
    const letter = progress.boardLetters[t.row]?.[t.col];
    return letter === t.letter.toUpperCase();
  });
}

export function GameClient({ puzzle }: GameClientProps) {
  const { dict, loading, error } = useDictionary();
  const [board, setBoard] = useState<BoardCell[][]>(() =>
    boardFromPuzzle(puzzle),
  );
  const [roundIndex, setRoundIndex] = useState(0);
  const [rackOrder, setRackOrder] = useState(puzzle.rounds[0].rack);
  const [selectedRackIndex, setSelectedRackIndex] = useState<number | null>(
    null,
  );
  const [tentative, setTentative] = useState<TentativeTile[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"ok" | "err">("err");
  const [scorePopup, setScorePopup] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solutionPlays, setSolutionPlays] = useState<SolutionPlayView[]>([]);
  const [rackMode, setRackMode] = useState<RackMode>("refill");
  const [bagIndex, setBagIndex] = useState(0);
  const [goldRackIndex, setGoldRackIndex] = useState<number | null>(null);
  const suppressClickRef = useRef(false);
  const refillBag = useMemo(() => puzzleRefillBag(puzzle), [puzzle]);
  const goldLetter = useMemo(() => puzzleGoldLetter(puzzle), [puzzle]);

  const usedRackIndices = useMemo(() => {
    const used = new Set<number>();
    for (const t of tentative) {
      if (t.rackIndex >= 0) used.add(t.rackIndex);
    }
    return used;
  }, [tentative]);

  function resetPuzzle() {
    const start = boardFromPuzzle(puzzle);
    setBoard(start);
    setRoundIndex(0);
    setRackOrder(puzzle.rounds[0].rack);
    setSelectedRackIndex(null);
    setTentative([]);
    setRoundResults([]);
    setMessage(null);
    setScorePopup(null);
    setFinished(false);
    setResult(null);
    setShowSolution(false);
    setSolutionPlays([]);
    setBagIndex(0);
    setGoldRackIndex(null);
    persistReset(start);
  }

  function persistReset(startBoard: BoardCell[][]) {
    saveProgress({
      puzzleId: puzzle.id,
      roundIndex: 0,
      boardLetters: serializeBoard(startBoard),
      roundResults: [],
      tentative: [],
      rackOrder: puzzle.rounds[0].rack,
      bagIndex: 0,
      goldRackIndex: null,
      finished: false,
    });
  }

  // Hydrate from localStorage (ignore saves that don't match current seed)
  useEffect(() => {
    setRackMode(loadRackMode());
    const progress = loadProgress(puzzle.id);
    if (progress && progressMatchesSeed(progress, puzzle)) {
      restoreProgress(progress);
      if (progress.finished && progress.result) {
        setFinished(true);
        setResult(progress.result);
        setStreak(loadStreak().count);
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.id]);

  function restoreProgress(progress: DayProgress) {
    const restored = cloneBoard(boardFromPuzzle(puzzle));
    for (let r = 0; r < restored.length; r++) {
      for (let c = 0; c < restored.length; c++) {
        const letter = progress.boardLetters[r]?.[c] ?? null;
        restored[r][c] = {
          ...restored[r][c],
          letter,
          locked: letter !== null,
        };
      }
    }
    for (const round of progress.roundResults) {
      for (const t of round.tilesPlaced) {
        if (t.isGold) {
          restored[t.row][t.col] = {
            ...restored[t.row][t.col],
            gold: true,
          };
        }
      }
    }
    const rack =
      progress.rackOrder ||
      puzzle.rounds[Math.min(progress.roundIndex, 2)].rack;
    setBoard(restored);
    setRoundIndex(progress.roundIndex);
    setRoundResults(progress.roundResults);
    setRackOrder(rack);
    setBagIndex(progress.bagIndex ?? 0);
    if (progress.roundIndex === 1) {
      const saved = progress.goldRackIndex;
      if (typeof saved === "number" && saved >= 0) {
        setGoldRackIndex(saved);
      } else if (goldLetter) {
        const idx = rack.toUpperCase().indexOf(goldLetter);
        setGoldRackIndex(idx >= 0 ? idx : null);
      } else {
        setGoldRackIndex(null);
      }
    } else {
      setGoldRackIndex(null);
    }
    setTentative(normalizeTentative(progress.tentative ?? [], rack));
    setFinished(progress.finished);
    if (progress.result) setResult(progress.result);
  }

  const persist = useCallback(
    (partial: Partial<DayProgress> & { board?: BoardCell[][] }) => {
      const boardLetters = serializeBoard(partial.board ?? board);
      const payload: DayProgress = {
        puzzleId: puzzle.id,
        roundIndex: partial.roundIndex ?? roundIndex,
        boardLetters,
        roundResults: partial.roundResults ?? roundResults,
        tentative: partial.tentative ?? tentative,
        rackOrder: partial.rackOrder ?? rackOrder,
        bagIndex: partial.bagIndex ?? bagIndex,
        goldRackIndex:
          partial.goldRackIndex !== undefined
            ? partial.goldRackIndex
            : goldRackIndex,
        finished: partial.finished ?? finished,
        result: partial.result ?? result ?? undefined,
      };
      saveProgress(payload);
    },
    [
      bagIndex,
      board,
      finished,
      goldRackIndex,
      puzzle.id,
      rackOrder,
      result,
      roundIndex,
      roundResults,
      tentative,
    ],
  );

  function handleRackModeChange(mode: RackMode) {
    setRackMode(mode);
    resetPuzzle();
  }

  function flash(msg: string, tone: "ok" | "err" = "err") {
    setMessageTone(tone);
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 2200);
  }

  function placeFromRack(rackIndex: number, row: number, col: number) {
    if (finished || board[row][col].letter) return;
    if (tentative.some((t) => t.row === row && t.col === col)) return;
    if (usedRackIndices.has(rackIndex)) return;

    const letter = rackOrder[rackIndex];
    const next: TentativeTile[] = [
      ...tentative,
      {
        letter,
        row,
        col,
        rackIndex,
        isGold: goldRackIndex === rackIndex,
      },
    ];
    const nowUsed = new Set(usedRackIndices);
    nowUsed.add(rackIndex);
    setTentative(next);
    const nextSel = rackOrder
      .split("")
      .findIndex((_, i) => !nowUsed.has(i) && i > rackIndex);
    const fallback = rackOrder
      .split("")
      .findIndex((_, i) => !nowUsed.has(i));
    setSelectedRackIndex(
      nextSel !== -1 ? nextSel : fallback !== -1 ? fallback : null,
    );
    persist({ tentative: next });
  }

  function onCellClick(row: number, col: number) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (finished || !dict) return;
    if (board[row][col].letter) return;

    const existingIdx = tentative.findIndex(
      (t) => t.row === row && t.col === col,
    );
    if (existingIdx !== -1) {
      const next = tentative.filter((_, i) => i !== existingIdx);
      setTentative(next);
      persist({ tentative: next });
      return;
    }

    if (selectedRackIndex === null) {
      flash("Select or drag a crate from the hold");
      return;
    }
    placeFromRack(selectedRackIndex, row, col);
  }

  function onRackSelect(index: number) {
    if (finished || usedRackIndices.has(index)) return;
    setSelectedRackIndex((cur) => (cur === index ? null : index));
  }

  function handleTileDrop(
    source: DragSource,
    target: DropTarget,
    didMove: boolean,
  ) {
    if (finished) return;
    if (didMove) suppressClickRef.current = true;

    if (source.type === "rack") {
      if (!didMove) return;
      if (target?.type === "cell") {
        placeFromRack(source.index, target.row, target.col);
      }
      return;
    }

    // Moving / recalling a tentative board tile
    if (target?.type === "rack" || target === null) {
      const next = tentative.filter(
        (t) => !(t.row === source.row && t.col === source.col),
      );
      setTentative(next);
      persist({ tentative: next });
      return;
    }

    if (target.type === "cell") {
      if (board[target.row][target.col].letter) return;
      if (
        tentative.some(
          (t) =>
            t.row === target.row &&
            t.col === target.col &&
            !(t.row === source.row && t.col === source.col),
        )
      ) {
        return;
      }
      const next = tentative.map((t) =>
        t.row === source.row && t.col === source.col
          ? { ...t, row: target.row, col: target.col }
          : t,
      );
      setTentative(next);
      persist({ tentative: next });
    }
  }

  const { drag, startDrag } = useTileDrag({
    enabled: !finished,
    onDrop: handleTileDrop,
    onTapRack: onRackSelect,
  });

  function recall() {
    setTentative([]);
    setSelectedRackIndex(null);
    // Explicit empty array so persist cannot fall back to a stale tentative
    persist({ tentative: [] as TentativeTile[] });
  }

  function shuffle() {
    const letters = rackOrder.split("");
    const unused = letters
      .map((l, i) => ({
        l,
        i,
        gold: goldRackIndex === i,
      }))
      .filter((x) => !usedRackIndices.has(x.i));
    const order = unused.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    let si = 0;
    let nextGold: number | null = goldRackIndex;
    const next = letters.map((l, i) => {
      if (usedRackIndices.has(i)) return l;
      const src = unused[order[si++]];
      if (src.gold) nextGold = i;
      return src.l;
    });
    setRackOrder(next.join(""));
    setGoldRackIndex(nextGold);
    setSelectedRackIndex(null);
    if (roundIndex === 1) {
      persist({ rackOrder: next.join(""), goldRackIndex: nextGold });
    }
  }

  function submit() {
    if (!dict || finished) return;
    if (tentative.length === 0) {
      flash("Stow at least one crate on the dock");
      return;
    }

    const best = puzzle.rounds[roundIndex].bestWord;
    const evaluated = evaluateRound(board, tentative, dict, best);
    if ("error" in evaluated) {
      flash(evaluated.error);
      return;
    }

    const { result: roundResult, board: nextBoard } = evaluated;
    const nextResults = [...roundResults, roundResult];
    setScorePopup(roundResult.score);
    window.setTimeout(() => setScorePopup(null), 1200);

    if (roundResult.hitBestWord) {
      flash(`Top mark · ${roundResult.mainWord}`, "ok");
    } else {
      flash(`${roundResult.mainWord} · ${roundResult.score}`, "ok");
    }

    if (roundIndex >= 2) {
      // Emoji vs stored normal-words best; "Show best solution" still uses the full play dict.
      const gameResult = buildGameResult(puzzle, nextResults);
      const streakCount = updateStreakOnFinish(puzzle.id, puzzle.date);
      setBoard(nextBoard);
      setRoundResults(nextResults);
      setTentative([]);
      setGoldRackIndex(null);
      setFinished(true);
      setResult(gameResult);
      setStreak(streakCount);
      persist({
        board: nextBoard,
        roundResults: nextResults,
        tentative: [],
        goldRackIndex: null,
        finished: true,
        result: gameResult,
        roundIndex: 3,
      });
      return;
    }

    const nextRound = roundIndex + 1;
    let nextRack = puzzle.rounds[nextRound].rack;
    let nextBagIndex = bagIndex;
    let keptLen = 0;

    if (rackMode === "refill") {
      const kept = remainingRack(rackOrder, tentative);
      keptLen = kept.length;
      const refilled = refillRack(kept, refillBag, bagIndex, 7);
      nextRack = refilled.rack;
      nextBagIndex = refilled.nextBagIndex;
    }

    let nextGoldIndex: number | null = null;
    if (nextRound === 1 && goldLetter) {
      const seated = seatGoldTile(nextRack, goldLetter, keptLen);
      nextRack = seated.rack;
      nextGoldIndex = seated.goldIndex;
      window.setTimeout(() => flash("Golden crate aboard", "ok"), 900);
    }

    setBoard(nextBoard);
    setRoundResults(nextResults);
    setRoundIndex(nextRound);
    setRackOrder(nextRack);
    setBagIndex(nextBagIndex);
    setGoldRackIndex(nextGoldIndex);
    setTentative([]);
    setSelectedRackIndex(null);
    persist({
      board: nextBoard,
      roundResults: nextResults,
      roundIndex: nextRound,
      rackOrder: nextRack,
      bagIndex: nextBagIndex,
      goldRackIndex: nextGoldIndex,
      tentative: [],
    });
  }

  const runningScore = roundResults.reduce((s, r) => s + r.score, 0);
  const solutionTotal = solutionPlays.reduce((s, p) => s + p.score, 0);

  async function revealBestSolution() {
    if (!dict) return;
    if (showSolution) {
      setShowSolution(false);
      setSolutionPlays([]);
      return;
    }
    const path = findBestSolutionPath(puzzle, dict, rackMode);
    setSolutionPlays(path.plays);
    setShowSolution(true);
  }

  if (loading || !hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center font-[family-name:var(--font-ui)] font-bold text-ink/60">
        Loading…
      </div>
    );
  }

  if (error || !dict) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 text-center font-[family-name:var(--font-ui)] font-bold text-proof">
        Could not load the word list. {error}
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col overflow-x-hidden">
      <DockScene />

      <header className="relative z-10 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div
          className={`flex justify-between gap-3 ${finished ? "items-start" : "items-end"}`}
        >
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-[family-name:var(--font-display)] text-[2rem] font-bold leading-none tracking-wide text-ink sm:text-[2.25rem]">
                Manifest
              </h1>
              <CargoShipMark />
              {!finished && (
                <HowToPlay mode={rackMode} onModeChange={handleRackModeChange} />
              )}
            </div>
            <p className="mt-1.5 font-[family-name:var(--font-ui)] text-[0.75rem] font-bold uppercase tracking-[0.14em] text-ink/45">
              #{String(puzzle.number).padStart(3, "0")} · {puzzle.date}
            </p>
          </div>
          {finished ? (
            <div className="pt-1">
              <HowToPlay mode={rackMode} onModeChange={handleRackModeChange} />
            </div>
          ) : (
            <div
              className="pixel-panel px-3 py-1.5 text-right"
              style={{ background: "#fff8e8" }}
            >
              <p className="font-[family-name:var(--font-ui)] text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-ink/45">
                {`Load ${roundIndex + 1} / 3`}
              </p>
              <p className="font-[family-name:var(--font-display)] text-3xl font-bold leading-none text-ink">
                {runningScore}
              </p>
            </div>
          )}
        </div>
      </header>

      {!finished ? (
        <>
          <div className="relative z-10 px-3 pt-2 sm:px-6">
            <Board
              board={board}
              tentative={tentative}
              selectedCell={null}
              onCellClick={onCellClick}
              drag={drag}
              onPointerDownTentative={(row, col, letter, e) => {
                const tile = tentative.find(
                  (t) => t.row === row && t.col === col,
                );
                startDrag(
                  {
                    type: "board",
                    row,
                    col,
                    letter,
                    gold: Boolean(tile?.isGold),
                  },
                  e,
                );
              }}
              seed={puzzle.seed}
            />
            <AnimatePresence>
              {scorePopup !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: -12, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-x-0 top-1/3 z-20 text-center"
                >
                  <span
                    className="pixel-btn inline-block px-4 py-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-wide text-ink"
                    style={{ background: "#ffcc33" }}
                  >
                    +{scorePopup}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DragGhost drag={drag} />

          <div className="relative z-10 mt-auto space-y-3 px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
            <Rack
              letters={rackOrder.split("")}
              selectedIndex={selectedRackIndex}
              disabledIndices={usedRackIndices}
              goldIndex={goldRackIndex}
              drag={drag}
              onPointerDownTile={(index, letter, e) =>
                startDrag(
                  {
                    type: "rack",
                    index,
                    letter,
                    gold: goldRackIndex === index,
                  },
                  e,
                )
              }
            />
            <AnimatePresence>
              {message && (
                <motion.p
                  key={message}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`px-2 text-center font-[family-name:var(--font-ui)] text-sm font-extrabold ${
                    messageTone === "err" ? "text-proof" : "text-ink"
                  }`}
                >
                  {message}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="flex gap-2 px-2">
              <button
                type="button"
                onClick={shuffle}
                className="pixel-btn bg-paper px-4 py-3 font-[family-name:var(--font-ui)] text-sm font-extrabold tracking-wide text-ink"
              >
                Shuffle
              </button>
              <button
                type="button"
                onClick={recall}
                className="pixel-btn bg-paper px-4 py-3 font-[family-name:var(--font-ui)] text-sm font-extrabold tracking-wide text-ink"
              >
                Return
              </button>
              <button
                type="button"
                onClick={submit}
                className="pixel-btn flex-1 py-3 font-[family-name:var(--font-ui)] font-extrabold tracking-wide text-ink"
                style={{ background: "#ffcc33" }}
              >
                Submit
              </button>
            </div>
          </div>
        </>
      ) : result ? (
        <div className="relative z-10 mt-3">
          <Results
            puzzle={puzzle}
            result={result}
            streak={streak}
            board={board}
            reviewPlays={(result.rounds ?? roundResults).map((r, i) => ({
              word: r.mainWord,
              score: r.score,
              tiles: r.tilesPlaced,
              round: i + 1,
            }))}
            solutionPlays={solutionPlays}
            showingSolution={showSolution}
            solutionTotal={solutionTotal}
            onViewSolution={revealBestSolution}
          />
        </div>
      ) : null}

    </div>
  );
}
