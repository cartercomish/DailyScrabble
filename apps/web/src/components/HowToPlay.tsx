"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { saveRackMode, type RackMode } from "../lib/storage";

const KEY = "manifest-seen-howto";

interface HowToPlayProps {
  mode: RackMode;
  onModeChange: (mode: RackMode) => void;
}

export function HowToPlay({ mode, onModeChange }: HowToPlayProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem(KEY)) setOpen(true);
  }, []);

  function dismiss() {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  }

  function toggleRefill(checked: boolean) {
    const next: RackMode = checked ? "refill" : "refresh";
    saveRackMode(next);
    onModeChange(next);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pixel-btn flex h-8 w-8 items-center justify-center bg-paper p-0 font-[family-name:var(--font-ui)] text-base font-extrabold leading-none text-ink"
        aria-label="How to play"
      >
        ?
      </button>
      {mounted &&
        open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="flex items-end justify-center bg-[rgba(110,176,224,0.55)] p-4 sm:items-center"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
            }}
          >
            <div
              className="pixel-panel w-full max-w-md p-5 text-ink"
              style={{ background: "#fff8e8" }}
            >
              <p className="font-[family-name:var(--font-ui)] text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-ink-soft">
                Dockside brief
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold tracking-wide text-ink">
                Manifest
              </h2>
              <p className="mt-2 font-[family-name:var(--font-ui)] text-sm font-semibold leading-relaxed text-ink-soft">
                Everyone gets the same board and letters. Play three rounds and
                try for a high score.
              </p>
              <ol className="mt-4 list-decimal space-y-2 pl-5 font-[family-name:var(--font-ui)] text-sm font-semibold leading-relaxed text-ink-soft">
                <li>Tap or drag letters from your rack onto the board.</li>
                <li>Make a valid connected word, then hit Submit.</li>
                <li>
                  {mode === "refill"
                    ? "Letters you don't use stay; used ones get replaced."
                    : "After each submit you get a new rack — three rounds total."}
                </li>
                <li>
                  Scoring uses letter values and bonus squares. Better scores
                  get a better share emoji.
                </li>
              </ol>

              <label className="mt-5 flex cursor-pointer items-center justify-between gap-3 border-2 border-ink px-3 py-3">
                <span className="font-[family-name:var(--font-ui)] text-sm font-extrabold text-ink">
                  Refill used letters only
                  <span className="mt-0.5 block text-xs font-bold text-ink-soft">
                    Testing · restarts today&apos;s puzzle
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={mode === "refill"}
                  onChange={(e) => toggleRefill(e.target.checked)}
                  className="h-5 w-5 accent-[#2a3340]"
                />
              </label>

              <button
                type="button"
                onClick={dismiss}
                className="pixel-btn mt-4 w-full py-3 font-[family-name:var(--font-ui)] font-extrabold tracking-wide text-ink"
                style={{ background: "#ffcc33" }}
              >
                Close
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
