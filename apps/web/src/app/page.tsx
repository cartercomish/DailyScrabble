import { GameClient } from "../components/GameClient";
import { loadTodayPuzzle } from "../lib/puzzles";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const puzzle = loadTodayPuzzle();
  return <GameClient puzzle={puzzle} />;
}
