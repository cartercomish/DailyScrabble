"use client";

import { Dictionary, loadDictionaryFromText } from "@daily-rack/engine";
import { useEffect, useState } from "react";

export interface Dictionaries {
  /** Wide list: decides whether a player's word is legal. */
  dict: Dictionary;
  /** Everyday list (content/words-gen.txt): the bot only plays these. */
  botDict: Dictionary;
}

let shared: Dictionaries | null = null;
let sharedPromise: Promise<Dictionaries> | null = null;

function fetchWords(url: string): Promise<Dictionary> {
  return fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${url}`);
      return r.text();
    })
    .then(loadDictionaryFromText);
}

async function fetchDictionaries(): Promise<Dictionaries> {
  if (shared) return shared;
  if (!sharedPromise) {
    sharedPromise = Promise.all([
      fetchWords("/words.txt?v=play-1"),
      fetchWords("/words-gen.txt?v=gen-1"),
    ]).then(([dict, botDict]) => {
      shared = { dict, botDict };
      return shared;
    });
  }
  return sharedPromise;
}

export function useDictionary() {
  const [dicts, setDicts] = useState<Dictionaries | null>(shared);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchDictionaries()
      .then((d) => {
        if (alive) setDicts(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load dictionary");
      });
    return () => {
      alive = false;
    };
  }, []);

  return {
    dict: dicts?.dict ?? null,
    botDict: dicts?.botDict ?? null,
    error,
    loading: !dicts && !error,
  };
}
