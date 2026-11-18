"use client";

import { motion } from "framer-motion";
import {
  MOBILE_RACK_TILE_PX,
  RACK_GAP_PX,
  RACK_PAD_X_PX,
  RACK_PAD_Y_PX,
} from "../lib/playLayout";
import type { DragState } from "../lib/useTileDrag";
import { TypeBlock } from "./TypeBlock";

interface RackProps {
  letters: string[];
  selectedIndex: number | null;
  disabledIndices: Set<number>;
  goldIndex?: number | null;
  drag: DragState | null;
  /** Desktop passes the board cell size so rack and board tiles match. */
  tilePx?: number;
  /** A tile just dropped by hand appears in its new slot without sliding. */
  droppedIndex?: number | null;
  onPointerDownTile: (index: number, letter: string, e: React.PointerEvent) => void;
}

export function Rack({
  letters,
  selectedIndex,
  disabledIndices,
  goldIndex = null,
  drag,
  tilePx = MOBILE_RACK_TILE_PX,
  droppedIndex = null,
  onPointerDownTile,
}: RackProps) {
  return (
    <div data-drop-rack="true" className="flex shrink-0 justify-center px-2 lg:px-0">
      <div
        className="pixel-panel inline-flex flex-nowrap justify-center"
        style={{
          background: "#ffe9b8",
          gap: RACK_GAP_PX,
          paddingLeft: RACK_PAD_X_PX,
          paddingRight: RACK_PAD_X_PX,
          paddingTop: RACK_PAD_Y_PX,
          paddingBottom: RACK_PAD_Y_PX,
        }}
      >
        {letters.map((letter, i) => {
          const used = disabledIndices.has(i);
          const selected = selectedIndex === i && !used;
          const gold = goldIndex === i;
          const rackSource =
            drag?.moved && drag.source.type === "rack" ? drag.source : null;
          const dragging = rackSource?.index === i;
          const insertTarget =
            rackSource !== null &&
            !dragging &&
            drag?.over?.type === "rack" &&
            drag.over.index === i;
          const nth = letters.slice(0, i).filter((l) => l === letter).length;

          return (
            <motion.button
              key={`rack-${letter}-${nth}${gold ? "-gold" : ""}${
                droppedIndex === i ? "-dropped" : ""
              }`}
              type="button"
              layout
              data-rack-slot={used ? undefined : i}
              aria-disabled={used}
              aria-label={gold ? `Golden crate ${letter}` : undefined}
              onPointerDown={(e) => {
                if (used) return;
                e.preventDefault();
                onPointerDownTile(i, letter, e);
              }}
              className="relative touch-none overflow-hidden"
              style={{
                width: tilePx,
                height: tilePx,
                transform:
                  insertTarget || (selected && !dragging)
                    ? "translateY(-3px)"
                    : undefined,
                boxShadow: insertTarget ? "0 0 0 3px #ffcc33" : "none",
                opacity: used || dragging ? 0.28 : 1,
                cursor: used ? "default" : "grab",
                pointerEvents: used ? "none" : "auto",
                filter: used ? "grayscale(0.35)" : undefined,
              }}
            >
              <TypeBlock
                letter={letter}
                selected={selected}
                gold={gold}
                size="rack"
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
