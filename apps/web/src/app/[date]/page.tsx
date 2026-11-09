import { notFound } from "next/navigation";
import { GameClient } from "../../components/GameClient";
import { loadPuzzleByDate } from "../../lib/puzzles";

export const dynamic = "force-dynamic";

export default async function DatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const puzzle = loadPuzzleByDate(date);
  if (!puzzle) notFound();
  return <GameClient puzzle={puzzle} />;
}
