import type { DailyPuzzle } from "./types";

export type ScoreEmoji = "🏆" | "⭐" | "📦" | "🌊";

/** Sum of each round's precomputed top-mark score (canonical best line). */
export function puzzleBestTotal(puzzle: DailyPuzzle): number {
  return puzzle.rounds.reduce((sum, r) => sum + r.bestWord.score, 0);
}

/**
 * Casual performance emoji vs the day's best line.
 * 🏆 crushed · ⭐ strong · 📦 solid · 🌊 rough
 */
export function scoreEmoji(score: number, best: number): ScoreEmoji {
  if (best <= 0) return "📦";
  const ratio = score / best;
  if (ratio >= 0.95) return "🏆";
  if (ratio >= 0.8) return "⭐";
  if (ratio >= 0.6) return "📦";
  return "🌊";
}

export function scoreEmojiLabel(emoji: ScoreEmoji): string {
  switch (emoji) {
    case "🏆":
      return "Crushed it";
    case "⭐":
      return "Strong run";
    case "📦":
      return "Solid load";
    case "🌊":
      return "Rough seas";
  }
}
