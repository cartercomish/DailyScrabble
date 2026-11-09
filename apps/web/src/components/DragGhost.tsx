"use client";

import { motion } from "framer-motion";
import type { DragState } from "../lib/useTileDrag";
import { TypeBlock } from "./TypeBlock";

export function DragGhost({ drag }: { drag: DragState | null }) {
  if (!drag?.moved) return null;

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0.85 }}
      animate={{ scale: 1.08, opacity: 1 }}
      className="pointer-events-none fixed z-[80] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
      style={{
        left: drag.x,
        top: drag.y,
        width: "3.25rem",
        height: "3.25rem",
        boxShadow: "4px 4px 0 rgba(42,51,64,0.25)",
      }}
    >
      <TypeBlock letter={drag.source.letter} selected size="ghost" />
    </motion.div>
  );
}
