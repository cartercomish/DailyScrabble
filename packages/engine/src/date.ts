/** Puzzle day identity in America/New_York, Wordle-style. */
export function getPuzzleDate(now = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA gives YYYY-MM-DD
  return fmt.format(now);
}

export function puzzleNumberForDate(date: string, epoch = "2026-04-12"): number {
  const [y, m, d] = date.split("-").map(Number);
  const [ey, em, ed] = epoch.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const eutc = Date.UTC(ey, em - 1, ed);
  return Math.floor((utc - eutc) / 86_400_000) + 1;
}

export function formatShare(
  puzzleNumber: number,
  totalScore: number,
  emoji: string,
  roundScores: number[],
  /** Bare host preferred (e.g. manifest.game) so chats skip rich link previews. */
  url: string,
): string {
  const rounds = roundScores.join(" · ");
  return `${url}\nManifest #${String(puzzleNumber).padStart(3, "0")}\n${rounds}\nTotal: ${totalScore} ${emoji}`;
}
