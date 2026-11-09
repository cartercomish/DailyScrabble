import type { Premium } from "./types";

/** Classic-style premium layout scaled to odd board sizes (11 or 15). */
export function createPremiumGrid(size: number): Premium[][] {
  const grid: Premium[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null as Premium),
  );

  if (size === 15) {
    apply15(grid);
  } else if (size === 11) {
    apply11(grid);
  } else if (size === 13) {
    apply13(grid);
  } else {
    // Generic: center DW, corners TW, mirrored pattern
    const mid = Math.floor(size / 2);
    grid[0][0] = "TW";
    grid[0][size - 1] = "TW";
    grid[size - 1][0] = "TW";
    grid[size - 1][size - 1] = "TW";
    grid[mid][mid] = "DW";
    setSym(grid, 0, mid, "TW");
    setSym(grid, mid, 0, "TW");
    setSym(grid, 1, 1, "DW");
    setSym(grid, 2, mid, "DL");
    setSym(grid, mid, 2, "DL");
    setSym(grid, 3, 3, "TL");
  }

  return grid;
}

function setSym(grid: Premium[][], r: number, c: number, p: Premium) {
  const n = grid.length - 1;
  const coords = [
    [r, c],
    [r, n - c],
    [n - r, c],
    [n - r, n - c],
    [c, r],
    [c, n - r],
    [n - c, r],
    [n - c, n - r],
  ];
  for (const [rr, cc] of coords) {
    if (rr >= 0 && rr <= n && cc >= 0 && cc <= n) {
      grid[rr][cc] = p;
    }
  }
}

function apply15(grid: Premium[][]) {
  const tw = [
    [0, 0],
    [0, 7],
    [0, 14],
    [7, 0],
    [7, 14],
    [14, 0],
    [14, 7],
    [14, 14],
  ];
  const dw = [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [1, 13],
    [2, 12],
    [3, 11],
    [4, 10],
    [13, 1],
    [12, 2],
    [11, 3],
    [10, 4],
    [13, 13],
    [12, 12],
    [11, 11],
    [10, 10],
    [7, 7],
  ];
  const tl = [
    [1, 5],
    [1, 9],
    [5, 1],
    [5, 5],
    [5, 9],
    [5, 13],
    [9, 1],
    [9, 5],
    [9, 9],
    [9, 13],
    [13, 5],
    [13, 9],
  ];
  const dl = [
    [0, 3],
    [0, 11],
    [2, 6],
    [2, 8],
    [3, 0],
    [3, 7],
    [3, 14],
    [6, 2],
    [6, 6],
    [6, 8],
    [6, 12],
    [7, 3],
    [7, 11],
    [8, 2],
    [8, 6],
    [8, 8],
    [8, 12],
    [11, 0],
    [11, 7],
    [11, 14],
    [12, 6],
    [12, 8],
    [14, 3],
    [14, 11],
  ];
  for (const [r, c] of tw) grid[r][c] = "TW";
  for (const [r, c] of dw) grid[r][c] = "DW";
  for (const [r, c] of tl) grid[r][c] = "TL";
  for (const [r, c] of dl) grid[r][c] = "DL";
}

function apply11(grid: Premium[][]) {
  const tw = [
    [0, 0],
    [0, 5],
    [0, 10],
    [5, 0],
    [5, 10],
    [10, 0],
    [10, 5],
    [10, 10],
  ];
  const dw = [
    [1, 1],
    [2, 2],
    [3, 3],
    [1, 9],
    [2, 8],
    [3, 7],
    [9, 1],
    [8, 2],
    [7, 3],
    [9, 9],
    [8, 8],
    [7, 7],
    [5, 5],
  ];
  const tl = [
    [1, 4],
    [1, 6],
    [4, 1],
    [4, 4],
    [4, 6],
    [4, 9],
    [6, 1],
    [6, 4],
    [6, 6],
    [6, 9],
    [9, 4],
    [9, 6],
  ];
  const dl = [
    [0, 2],
    [0, 8],
    [2, 0],
    [2, 5],
    [2, 10],
    [3, 3],
    [3, 7],
    [5, 2],
    [5, 8],
    [7, 3],
    [7, 7],
    [8, 0],
    [8, 5],
    [8, 10],
    [10, 2],
    [10, 8],
  ];
  for (const [r, c] of tw) grid[r][c] = "TW";
  for (const [r, c] of dw) grid[r][c] = "DW";
  for (const [r, c] of tl) grid[r][c] = "TL";
  for (const [r, c] of dl) grid[r][c] = "DL";
}

function apply13(grid: Premium[][]) {
  const tw = [
    [0, 0],
    [0, 6],
    [0, 12],
    [6, 0],
    [6, 12],
    [12, 0],
    [12, 6],
    [12, 12],
  ];
  const dw = [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [1, 11],
    [2, 10],
    [3, 9],
    [4, 8],
    [11, 1],
    [10, 2],
    [9, 3],
    [8, 4],
    [11, 11],
    [10, 10],
    [9, 9],
    [8, 8],
    [6, 6],
  ];
  const tl = [
    [1, 5],
    [1, 7],
    [5, 1],
    [5, 5],
    [5, 7],
    [5, 11],
    [7, 1],
    [7, 5],
    [7, 7],
    [7, 11],
    [11, 5],
    [11, 7],
  ];
  const dl = [
    [0, 3],
    [0, 9],
    [2, 6],
    [3, 0],
    [3, 6],
    [3, 12],
    [6, 2],
    [6, 3],
    [6, 9],
    [6, 10],
    [9, 0],
    [9, 6],
    [9, 12],
    [10, 6],
    [12, 3],
    [12, 9],
  ];
  for (const [r, c] of tw) grid[r][c] = "TW";
  for (const [r, c] of dw) grid[r][c] = "DW";
  for (const [r, c] of tl) grid[r][c] = "TL";
  for (const [r, c] of dl) grid[r][c] = "DL";
}
