"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DragSource =
  | { type: "rack"; index: number; letter: string }
  | { type: "board"; row: number; col: number; letter: string };

export type DropTarget =
  | { type: "cell"; row: number; col: number }
  | { type: "rack" }
  | null;

export interface DragState {
  source: DragSource;
  x: number;
  y: number;
  over: DropTarget;
  moved: boolean;
}

const DRAG_THRESHOLD = 8;

function readDropTarget(x: number, y: number): DropTarget {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!el) return null;
  const cell = el.closest("[data-board-cell]") as HTMLElement | null;
  if (cell?.dataset.boardCell) {
    const [row, col] = cell.dataset.boardCell.split(",").map(Number);
    return { type: "cell", row, col };
  }
  if (el.closest("[data-drop-rack]")) return { type: "rack" };
  return null;
}

export function useTileDrag(opts: {
  enabled: boolean;
  onDrop: (source: DragSource, target: DropTarget, didMove: boolean) => void;
  onTapRack?: (index: number) => void;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const clear = useCallback(() => {
    dragRef.current = null;
    originRef.current = null;
    pointerIdRef.current = null;
    setDrag(null);
  }, []);

  const startDrag = useCallback(
    (source: DragSource, e: React.PointerEvent) => {
      if (!optsRef.current.enabled) return;
      if (e.button !== undefined && e.button !== 0) return;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      pointerIdRef.current = e.pointerId;
      originRef.current = { x: e.clientX, y: e.clientY };
      const next: DragState = {
        source,
        x: e.clientX,
        y: e.clientY,
        over: readDropTarget(e.clientX, e.clientY),
        moved: false,
      };
      dragRef.current = next;
      setDrag(next);
    },
    [],
  );

  useEffect(() => {
    if (!drag) return;

    function onMove(e: PointerEvent) {
      if (
        pointerIdRef.current !== null &&
        e.pointerId !== pointerIdRef.current
      ) {
        return;
      }
      const origin = originRef.current;
      const current = dragRef.current;
      if (!origin || !current) return;

      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      const moved =
        current.moved || Math.hypot(dx, dy) >= DRAG_THRESHOLD;
      const next: DragState = {
        ...current,
        x: e.clientX,
        y: e.clientY,
        over: readDropTarget(e.clientX, e.clientY),
        moved,
      };
      dragRef.current = next;
      setDrag(next);
      if (moved) e.preventDefault();
    }

    function onUp(e: PointerEvent) {
      if (
        pointerIdRef.current !== null &&
        e.pointerId !== pointerIdRef.current
      ) {
        return;
      }
      const current = dragRef.current;
      if (!current) {
        clear();
        return;
      }

      const target = readDropTarget(e.clientX, e.clientY);
      const didMove = current.moved;

      if (!didMove && current.source.type === "rack") {
        optsRef.current.onTapRack?.(current.source.index);
      } else if (didMove) {
        optsRef.current.onDrop(current.source, target, didMove);
      } else if (!didMove && current.source.type === "board") {
        // tap tentative tile = recall (same as click)
        optsRef.current.onDrop(current.source, { type: "rack" }, false);
      }
      clear();
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [drag, clear]);

  return { drag, startDrag };
}
