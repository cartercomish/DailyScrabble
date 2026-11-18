import type { PlacedTile } from "@daily-rack/engine";

export interface PlayForTags {
  word: string;
  score: number;
  tiles: PlacedTile[];
  round: number;
}

/** Two-line tag (RX / score) — keep narrow for edge plays. */
export const TAG_W = 1.85;
export const TAG_H = 1.35;
export const TAG_GAP = 0.08;

/**
 * How far a tag may stick past the grid into sealed-card padding (cell units).
 * Must stay inside the share screenshot; Results board padding matches this.
 */
export const CAPTURE_PAD = 1.05;

export type TagSide = "above" | "below" | "left" | "right";

export interface TagBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface TagPlacement {
  side: TagSide;
  anchorRow: number;
  anchorCol: number;
  cx: number;
  cy: number;
  box: TagBox;
}

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function boxesOverlap(a: TagBox, b: TagBox): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

export function tagOverlapsLetters(box: TagBox, occupied: Set<string>): number {
  const c0 = Math.floor(box.x0);
  const c1 = Math.ceil(box.x1) - 1;
  const r0 = Math.floor(box.y0);
  const r1 = Math.ceil(box.y1) - 1;
  let hits = 0;
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (!occupied.has(cellKey(r, c))) continue;
      if (boxesOverlap(box, { x0: c, y0: r, x1: c + 1, y1: r + 1 })) hits++;
    }
  }
  return hits;
}

export function tagOverlapsReserved(box: TagBox, reserved: TagBox[]): boolean {
  return reserved.some((r) => boxesOverlap(box, r));
}

/** How far a tag AABB sticks past the board grid in cell units. */
export function tagOverhang(box: TagBox, size: number): number {
  let o = 0;
  if (box.x0 < 0) o += -box.x0;
  if (box.y0 < 0) o += -box.y0;
  if (box.x1 > size) o += box.x1 - size;
  if (box.y1 > size) o += box.y1 - size;
  return o;
}

/**
 * How far a tag sticks past the sealed-card capture frame
 * (board expanded by CAPTURE_PAD on each side).
 */
export function tagCaptureOverhang(
  box: TagBox,
  size: number,
  pad = CAPTURE_PAD,
): number {
  let o = 0;
  if (box.x0 < -pad) o += -pad - box.x0;
  if (box.y0 < -pad) o += -pad - box.y0;
  if (box.x1 > size + pad) o += box.x1 - (size + pad);
  if (box.y1 > size + pad) o += box.y1 - (size + pad);
  return o;
}

export function candidatesForAnchor(row: number, col: number): TagPlacement[] {
  const midC = col + 0.5;
  const midR = row + 0.5;
  return [
    {
      side: "above",
      anchorRow: row,
      anchorCol: col,
      cx: midC,
      cy: row - TAG_GAP,
      box: {
        x0: midC - TAG_W / 2,
        y0: row - TAG_GAP - TAG_H,
        x1: midC + TAG_W / 2,
        y1: row - TAG_GAP,
      },
    },
    {
      side: "below",
      anchorRow: row,
      anchorCol: col,
      cx: midC,
      cy: row + 1 + TAG_GAP,
      box: {
        x0: midC - TAG_W / 2,
        y0: row + 1 + TAG_GAP,
        x1: midC + TAG_W / 2,
        y1: row + 1 + TAG_GAP + TAG_H,
      },
    },
    {
      side: "left",
      anchorRow: row,
      anchorCol: col,
      cx: col - TAG_GAP,
      cy: midR,
      box: {
        x0: col - TAG_GAP - TAG_W,
        y0: midR - TAG_H / 2,
        x1: col - TAG_GAP,
        y1: midR + TAG_H / 2,
      },
    },
    {
      side: "right",
      anchorRow: row,
      anchorCol: col,
      cx: col + 1 + TAG_GAP,
      cy: midR,
      box: {
        x0: col + 1 + TAG_GAP,
        y0: midR - TAG_H / 2,
        x1: col + 1 + TAG_GAP + TAG_W,
        y1: midR + TAG_H / 2,
      },
    },
  ];
}

function minDistToOtherPlays(
  row: number,
  col: number,
  otherTiles: Set<string>,
): number {
  if (otherTiles.size === 0) return Number.POSITIVE_INFINITY;
  let best = Number.POSITIVE_INFINITY;
  for (const key of otherTiles) {
    const [or, oc] = key.split(",").map(Number);
    const d = Math.abs(or - row) + Math.abs(oc - col);
    if (d < best) best = d;
  }
  return best;
}

export function orderedAnchorTiles(
  play: PlayForTags,
  claimedAnchors: Set<string>,
  otherTiles: Set<string>,
): PlacedTile[] {
  return [...play.tiles]
    .filter((t) => !claimedAnchors.has(cellKey(t.row, t.col)))
    .sort((a, b) => {
      const da = minDistToOtherPlays(a.row, a.col, otherTiles);
      const db = minDistToOtherPlays(b.row, b.col, otherTiles);
      if (db !== da) return db - da;
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
}

/**
 * Shift a tag so its AABB stays inside the sealed capture frame
 * (board ± CAPTURE_PAD). May overhang the grid itself.
 */
export function clampTagToCapture(
  placement: TagPlacement,
  size: number,
  pad = CAPTURE_PAD,
): TagPlacement {
  const min = -pad;
  const max = size + pad;
  let { x0, y0, x1, y1 } = placement.box;
  let dx = 0;
  let dy = 0;
  if (x0 < min) dx = min - x0;
  if (x1 + dx > max) dx = max - x1;
  if (y0 < min) dy = min - y0;
  if (y1 + dy > max) dy = max - y1;
  x0 += dx;
  x1 += dx;
  y0 += dy;
  y1 += dy;
  if (x0 < min) {
    dx = min - x0;
    x0 += dx;
    x1 += dx;
  }
  if (x1 > max) {
    dx = max - x1;
    x0 += dx;
    x1 += dx;
  }
  if (y0 < min) {
    dy = min - y0;
    y0 += dy;
    y1 += dy;
  }
  if (y1 > max) {
    dy = max - y1;
    y0 += dy;
    y1 += dy;
  }
  return {
    ...placement,
    cx: placement.cx + (x0 - placement.box.x0),
    cy: placement.cy + (y0 - placement.box.y0),
    box: { x0, y0, x1, y1 },
  };
}

export function pickTagPlacement(
  play: PlayForTags,
  occupied: Set<string>,
  reserved: TagBox[],
  claimedAnchors: Set<string>,
  otherTiles: Set<string>,
  size: number,
): TagPlacement | null {
  if (play.tiles.length === 0) return null;

  const anchors = orderedAnchorTiles(play, claimedAnchors, otherTiles);
  if (anchors.length === 0) return null;

  let best: TagPlacement | null = null;
  let bestCost = Number.POSITIVE_INFINITY;

  for (const tile of anchors) {
    const candidates = candidatesForAnchor(tile.row, tile.col);
    for (const candidate of candidates) {
      const clamped = clampTagToCapture(candidate, size);
      if (tagOverlapsReserved(clamped.box, reserved)) continue;
      const hits = tagOverlapsLetters(clamped.box, occupied);
      // Prefer staying inside the screenshot frame; letter overlap is secondary.
      // Soft preference for less board overhang when capture cost ties.
      const capture = tagCaptureOverhang(clamped.box, size);
      const board = tagOverhang(clamped.box, size);
      const cost = capture * 1000 + hits * 10 + board;
      if (cost < bestCost) {
        bestCost = cost;
        best = clamped;
      }
    }
  }

  return best;
}

export interface LaidOutTag {
  play: PlayForTags;
  placement: TagPlacement;
}

/** Place all round score tags the same way the results board does. */
export function layoutPlayTags(
  plays: PlayForTags[],
  size: number,
  occupied: Set<string>,
): LaidOutTag[] {
  const reserved: TagBox[] = [];
  const claimedAnchors = new Set<string>();
  const allTiles = plays.flatMap((p) =>
    p.tiles.map((t) => cellKey(t.row, t.col)),
  );
  const out: LaidOutTag[] = [];

  for (const play of plays) {
    const own = new Set(play.tiles.map((t) => cellKey(t.row, t.col)));
    const otherTiles = new Set(allTiles.filter((k) => !own.has(k)));
    const placement = pickTagPlacement(
      play,
      occupied,
      reserved,
      claimedAnchors,
      otherTiles,
      size,
    );
    if (!placement) continue;
    reserved.push(placement.box);
    claimedAnchors.add(cellKey(placement.anchorRow, placement.anchorCol));
    out.push({ play, placement });
  }

  return out;
}

/** SVG “screenshot” of sealed card + board + score tags for visual fixtures. */
export function renderTagFixtureSvg(
  name: string,
  size: number,
  occupied: Set<string>,
  tags: LaidOutTag[],
  cellPx = 28,
  padCells = CAPTURE_PAD,
): string {
  const padPx = padCells * cellPx;
  const boardPx = size * cellPx;
  const frame = boardPx + padPx * 2;
  const labelH = 22;
  const width = frame + 16;
  const height = frame + labelH + 16;
  const ox = 8 + padPx;
  const oy = labelH + 8 + padPx;
  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
  );
  parts.push(`<rect width="100%" height="100%" fill="#fff8e8"/>`);
  parts.push(
    `<text x="8" y="16" font-family="monospace" font-size="12" fill="#2a3340">${escapeXml(name)}</text>`,
  );
  // Sealed capture frame (what the screenshot must contain)
  parts.push(
    `<rect x="8" y="${labelH + 8}" width="${frame}" height="${frame}" fill="#fff8e8" stroke="#2a3340" stroke-width="2" stroke-dasharray="4 3"/>`,
  );
  parts.push(`<g transform="translate(${ox}, ${oy})">`);
  parts.push(`<rect width="${boardPx}" height="${boardPx}" fill="#a88858"/>`);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const key = cellKey(r, c);
      const filled = occupied.has(key);
      parts.push(
        `<rect x="${c * cellPx + 1}" y="${r * cellPx + 1}" width="${cellPx - 2}" height="${cellPx - 2}" fill="${filled ? "#efcf8e" : "#d4b888"}" stroke="#2a3340" stroke-width="1"/>`,
      );
      if (filled) {
        parts.push(
          `<text x="${c * cellPx + cellPx / 2}" y="${r * cellPx + cellPx / 2 + 4}" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="#1a2230">·</text>`,
        );
      }
    }
  }

  for (const { play, placement } of tags) {
    const x = placement.box.x0 * cellPx;
    const y = placement.box.y0 * cellPx;
    const w = (placement.box.x1 - placement.box.x0) * cellPx;
    const h = (placement.box.y1 - placement.box.y0) * cellPx;
    parts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#7ec8e3" stroke="#2a3340" stroke-width="2"/>`,
      `<text x="${x + w / 2}" y="${y + h / 2 - 4}" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#1a2230">R${play.round}</text>`,
      `<text x="${x + w / 2}" y="${y + h / 2 + 8}" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#1a2230">${play.score} pts</text>`,
    );
  }

  parts.push(`</g></svg>`);
  return parts.join("\n");
}

function escapeXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
