"use client";

import { Dictionary, loadDictionaryFromText } from "@daily-rack/engine";
import { useEffect, useState } from "react";

let shared: Dictionary | null = null;
let sharedPromise: Promise<Dictionary> | null = null;

async function fetchDictionary(): Promise<Dictionary> {
  if (shared) return shared;
  if (!sharedPromise) {
    // Play acceptance list (wide). Generation uses content/words-gen.txt separately.
    sharedPromise = fetch("/words.txt?v=play-1")
      .then((r) => r.text())
      .then((text) => {
        shared = loadDictionaryFromText(text);
        return shared;
      });
  }
  return sharedPromise;
}

export function useDictionary() {
  const [dict, setDict] = useState<Dictionary | null>(shared);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchDictionary()
      .then((d) => {
        if (alive) setDict(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load dictionary");
      });
    return () => {
      alive = false;
    };
  }, []);

  return { dict, error, loading: !dict && !error };
}
