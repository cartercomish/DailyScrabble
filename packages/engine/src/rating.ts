import type { DailyPuzzle } from "./types";

export type ScoreEmoji = "🤯" | "🏆" | "⭐" | "📦" | "🫠";

/** Sum of each round's normal-words top mark (gen dict). Used for score emoji. */
export function puzzleBestTotal(puzzle: DailyPuzzle): number {
  return puzzle.rounds.reduce((sum, r) => sum + r.bestWord.score, 0);
}

/**
 * Casual tiers vs normal-words best; 🤯 only for matching the full-dict best path.
 * 🤯 matched solution · 🏆 crushed · ⭐ strong · 📦 solid · 🫠 sank
 */
export function scoreEmoji(
  score: number,
  casualBest: number,
  solutionBest?: number | null,
): ScoreEmoji {
  if (
    solutionBest != null &&
    solutionBest > 0 &&
    score === solutionBest
  ) {
    return "🤯";
  }
  if (casualBest <= 0) return "📦";
  const ratio = score / casualBest;
  if (ratio >= 0.85) return "🏆";
  if (ratio >= 0.65) return "⭐";
  if (ratio >= 0.45) return "📦";
  return "🫠";
}

