/** Pixel chrome around the live board: panel border + padding + grid border + grid padding. */
export const BOARD_FRAME_PX = (3 + 8 + 3 + 4) * 2;
export const BOARD_CELL_GAP_PX = 3;

export const RACK_BORDER_PX = 3 * 2;
export const RACK_PAD_X_PX = 10;
export const RACK_PAD_Y_PX = 10;
export const RACK_GAP_PX = 6;
export const MOBILE_RACK_TILE_PX = 52;

/** Space between the board and the rack in the play column. */
export const COLUMN_GAP_PX = 10;
/** Desktop button rail width plus its gap from the board. */
export const DESKTOP_RAIL_PX = 176 + 12;
/** Room for the rack's drop shadow so it never clips. */
const SLACK_PX = 4;
const MIN_TILE_PX = 18;

export interface PlayLayout {
  boardPx: number;
  rackTile: number;
  desktop: boolean;
}

/**
 * Picks the rack tile size, then gives the board every remaining pixel of
 * height above the rack (capped by width). Desktop rack tiles match the
 * board's cells; mobile keeps larger rack tiles while they fit the width.
 */
export function fitPlayLayout(
  width: number,
  height: number,
  size: number,
  rackTiles: number,
  desktop: boolean,
): PlayLayout {
  const n = Math.max(1, rackTiles);
  const boardFixed = BOARD_FRAME_PX + (size - 1) * BOARD_CELL_GAP_PX;
  const rackFixedH = RACK_BORDER_PX + RACK_PAD_Y_PX * 2;
  const rackFixedW = RACK_BORDER_PX + RACK_PAD_X_PX * 2 + (n - 1) * RACK_GAP_PX;
  const byRackWidth = (width - rackFixedW) / n;
  const reserved = COLUMN_GAP_PX + rackFixedH + SLACK_PX;

  let rackTile: number;
  if (desktop) {
    const byBoardWidth = (width - boardFixed) / size;
    const byHeight = (height - boardFixed - reserved) / (size + 1);
    rackTile = Math.floor(Math.min(byBoardWidth, byRackWidth, byHeight));
  } else {
    rackTile = Math.floor(Math.min(MOBILE_RACK_TILE_PX, byRackWidth));
  }
  rackTile = Math.max(MIN_TILE_PX, rackTile);

  const boardPx = Math.max(
    boardFixed + size * MIN_TILE_PX,
    Math.floor(Math.min(width, height - reserved - rackTile)),
  );
  return { boardPx, rackTile, desktop };
}
