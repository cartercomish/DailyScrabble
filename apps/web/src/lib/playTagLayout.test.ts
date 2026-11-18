import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  cellKey,
  layoutPlayTags,
  renderTagFixtureSvg,
  tagCaptureOverhang,
  tagOverlapsLetters,
  type PlayForTags,
} from "./playTagLayout";

const FIXTURE_DIR = path.resolve(
  process.cwd(),
  "test-output",
  "tag-fixtures",
);

function occupiedFromPlays(plays: PlayForTags[]): Set<string> {
  return new Set(
    plays.flatMap((p) => p.tiles.map((t) => cellKey(t.row, t.col))),
  );
}

function horizontal(
  word: string,
  row: number,
  col: number,
  round: number,
  score: number,
): PlayForTags {
  return {
    word,
    score,
    round,
    tiles: word.split("").map((letter, i) => ({
      letter,
      row,
      col: col + i,
    })),
  };
}

function vertical(
  word: string,
  row: number,
  col: number,
  round: number,
  score: number,
): PlayForTags {
  return {
    word,
    score,
    round,
    tiles: word.split("").map((letter, i) => ({
      letter,
      row: row + i,
      col,
    })),
  };
}

function assertTagsInCapture(
  name: string,
  size: number,
  plays: PlayForTags[],
) {
  const occupied = occupiedFromPlays(plays);
  const tags = layoutPlayTags(plays, size, occupied);
  expect(tags.length, `${name}: expected a tag per play`).toBe(plays.length);

  for (const { play, placement } of tags) {
    const overhang = tagCaptureOverhang(placement.box, size);
    expect(
      overhang,
      `${name}: R${play.round} "${play.word}" leaves the sealed capture by ${overhang} (side=${placement.side})`,
    ).toBe(0);
  }

  fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  const svg = renderTagFixtureSvg(name, size, occupied, tags);
  const file = path.join(FIXTURE_DIR, `${name}.svg`);
  fs.writeFileSync(file, svg, "utf8");
  expect(fs.existsSync(file)).toBe(true);
}

describe("play tag layout fixtures", () => {
  it("prefers one-line tags in open mid-board space", () => {
    const size = 11;
    const plays = [
      horizontal("GAME", 5, 3, 1, 18),
      vertical("PLAY", 3, 5, 2, 22),
      horizontal("WORD", 7, 4, 3, 16),
    ];
    const occupied = occupiedFromPlays(plays);
    const tags = layoutPlayTags(plays, size, occupied);
    expect(tags.every((t) => !t.placement.stacked)).toBe(true);
    assertTagsInCapture("mid-board-one-line", size, plays);
  });

  it("tries alternate round order so tags avoid covering letters", () => {
    // R1 horizontal mid-board; R2 vertical through its center. Placing R1
    // first often parks the R1 tag on R2's stem; placing R2 first frees a
    // clear side for both.
    const size = 11;
    const plays = [
      horizontal("CROSS", 5, 3, 1, 20),
      vertical("POLE", 3, 5, 2, 18),
      horizontal("END", 8, 4, 3, 12),
    ];
    const occupied = occupiedFromPlays(plays);
    const tags = layoutPlayTags(plays, size, occupied);
    expect(tags.length).toBe(3);
    for (const { play, placement } of tags) {
      expect(
        tagOverlapsLetters(placement.box, occupied),
        `R${play.round} "${play.word}" covers letters`,
      ).toBe(0);
    }
    assertTagsInCapture("order-sensitive-cross", size, plays);
  });

  it("keeps a short right-edge word inside the sealed capture (Manifest 221-style)", () => {
    const size = 11;
    const plays = [
      horizontal("ALONE", 5, 2, 1, 2),
      vertical("OPEN", 2, 5, 2, 24),
      horizontal("TO", 4, 9, 3, 2),
    ];
    assertTagsInCapture("right-edge-short-word", size, plays);
  });

  it("allows board overhang but keeps corners inside the sealed capture", () => {
    const size = 11;
    const plays = [
      horizontal("AB", 0, 0, 1, 4),
      horizontal("CD", 0, 9, 2, 8),
      horizontal("EF", 10, 0, 3, 12),
    ];
    assertTagsInCapture("corners-top", size, plays);
  });

  it("keeps bottom-right edge cluster inside the sealed capture", () => {
    const size = 11;
    const plays = [
      horizontal("XY", 10, 9, 1, 10),
      vertical("ZQ", 8, 10, 2, 20),
      horizontal("HI", 9, 8, 3, 6),
    ];
    assertTagsInCapture("bottom-right-cluster", size, plays);
  });

  it("keeps left-edge vertical play inside the sealed capture", () => {
    const size = 11;
    const plays = [
      vertical("CAT", 4, 0, 1, 10),
      horizontal("DOG", 5, 1, 2, 14),
      horizontal("PIG", 7, 1, 3, 16),
    ];
    assertTagsInCapture("left-edge-vertical", size, plays);
  });

  it("keeps top-edge crowded tags inside the sealed capture", () => {
    const size = 11;
    const plays = [
      horizontal("TOP", 0, 3, 1, 9),
      horizontal("TIP", 0, 6, 2, 11),
      vertical("TAN", 0, 5, 3, 7),
    ];
    assertTagsInCapture("top-edge-crowded", size, plays);
  });

  it("never leaves the sealed capture across edge cases", () => {
    const size = 11;
    const cases: { name: string; plays: PlayForTags[] }[] = [
      {
        name: "mid-board-baseline",
        plays: [
          horizontal("GAME", 5, 3, 1, 18),
          vertical("PLAY", 3, 5, 2, 22),
          horizontal("WORD", 7, 4, 3, 16),
        ],
      },
      {
        name: "all-right-column",
        plays: [
          vertical("AB", 1, 10, 1, 4),
          vertical("CD", 4, 10, 2, 6),
          vertical("EF", 7, 10, 3, 8),
        ],
      },
      {
        name: "all-left-column",
        plays: [
          vertical("AB", 1, 0, 1, 4),
          vertical("CD", 4, 0, 2, 6),
          vertical("EF", 7, 0, 3, 8),
        ],
      },
      {
        name: "all-top-row",
        plays: [
          horizontal("AB", 0, 1, 1, 4),
          horizontal("CD", 0, 4, 2, 6),
          horizontal("EF", 0, 7, 3, 8),
        ],
      },
      {
        name: "all-bottom-row",
        plays: [
          horizontal("AB", 10, 1, 1, 4),
          horizontal("CD", 10, 4, 2, 6),
          horizontal("EF", 10, 7, 3, 8),
        ],
      },
    ];

    for (const c of cases) {
      assertTagsInCapture(c.name, size, c.plays);
    }
  });
});
