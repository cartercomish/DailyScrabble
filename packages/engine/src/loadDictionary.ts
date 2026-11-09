import { Dictionary } from "./dictionary";

let cached: Dictionary | null = null;

export function dictionaryFromWordList(words: string[]): Dictionary {
  return new Dictionary(words);
}

export function getCachedDictionary(): Dictionary | null {
  return cached;
}

export function setCachedDictionary(dict: Dictionary) {
  cached = dict;
}

export function loadDictionaryFromText(text: string): Dictionary {
  const dict = Dictionary.fromText(text);
  cached = dict;
  return dict;
}
