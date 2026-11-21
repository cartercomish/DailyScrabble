import { getPuzzleDate } from "@daily-rack/engine";
import { notFound } from "next/navigation";
import { GameClient } from "../../components/GameClient";
import { loadPuzzleByDate } from "../../lib/puzzles";

export const dynamic = "force-dynamic";

/**
 * Tomorrow's puzzle, ahead of release, for vetting. Plays as a preview: no
 * saves and no streak, so the real day still plays fresh.
 */
export default function DevNextDayPage() {
  const [y, m, d] = getPuzzleDate().split("-").map(Number);
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  const puzzle = loadPuzzleByDate(tomorrow);
  if (!puzzle) notFound();
  return <GameClient puzzle={puzzle} preview />;
}
