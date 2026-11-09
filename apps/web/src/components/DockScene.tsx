"use client";

import { motion } from "framer-motion";

/** Soft sky dressing — clouds + gull. */
export function DockScene() {
  return (
    <>
      <motion.img
        src="/decor/cloud.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-[4%] top-3 w-16 opacity-90 sm:w-20"
        animate={{ x: [0, 12, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={{ imageRendering: "pixelated" }}
      />
      <motion.img
        src="/decor/cloud.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-[8%] top-10 w-12 opacity-80 sm:w-16"
        animate={{ x: [0, -10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        style={{ imageRendering: "pixelated" }}
      />
      <motion.img
        src="/decor/seagull.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-[52%] top-14 w-8 sm:w-10"
        animate={{ y: [0, -6, 0], x: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ imageRendering: "pixelated" }}
      />
    </>
  );
}

export function CargoShipMark() {
  return (
    <motion.img
      src="/decor/cargoship.svg"
      alt=""
      aria-hidden
      className="h-9 w-auto sm:h-10"
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
