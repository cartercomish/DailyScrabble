"use client";

import { motion } from "framer-motion";
import type { DragState } from "../lib/useTileDrag";
import { TypeBlock } from "./TypeBlock";

interface RackProps {
  letters: string[];
  selectedIndex: number | null;
  disabledIndices: Set<number>;
  drag: DragState | null;
  onPointerDownTile: (index: number, letter: string, e: React.PointerEvent) => void;
}

export function Rack({
  letters,
  selectedIndex,
  disabledIndices,
  drag,
  onPointerDownTile,
}: RackProps) {
  return (
    <div data-drop-rack="true" className="px-2">
      <div
        className="pixel-panel flex justify-center gap-1.5 px-2 py-3"
        style={{ background: "#ffe9b8" }}
      >
        {letters.map((letter, i) => {
          const used = disabledIndices.has(i);
          const selected = selectedIndex === i && !used;
          const dragging =
            drag?.moved &&
            drag.source.type === "rack" &&
            drag.source.index === i;

          return (
            <motion.button
              key={`rack-${i}-${letter}`}
              type="button"
              layout
              aria-disabled={used}
              onPointerDown={(e) => {
                if (used) return;
                e.preventDefault();
                onPointerDownTile(i, letter, e);
              }}
              className="relative touch-none overflow-hidden"
              style={{
                width: "3.25rem",
                height: "3.25rem",
                transform: selected && !dragging ? "translateY(-3px)" : undefined,
                opacity: used || dragging ? 0.28 : 1,
                cursor: used ? "default" : "grab",
                pointerEvents: used ? "none" : "auto",
                filter: used ? "grayscale(0.35)" : undefined,
              }}
            >
              <TypeBlock letter={letter} selected={selected} size="rack" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
