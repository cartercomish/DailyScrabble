export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  terminal = false;
}

export class Dictionary {
  private root = new TrieNode();
  private words = new Set<string>();

  constructor(wordList: string[] = []) {
    for (const w of wordList) this.add(w);
  }

  add(word: string) {
    const w = word.trim().toUpperCase();
    if (w.length < 2 || !/^[A-Z]+$/.test(w)) return;
    this.words.add(w);
    let node = this.root;
    for (const ch of w) {
      let next = node.children.get(ch);
      if (!next) {
        next = new TrieNode();
        node.children.set(ch, next);
      }
      node = next;
    }
    node.terminal = true;
  }

  has(word: string): boolean {
    return this.words.has(word.toUpperCase());
  }

  get size(): number {
    return this.words.size;
  }

  getRoot(): TrieNode {
    return this.root;
  }

  static fromText(text: string): Dictionary {
    const dict = new Dictionary();
    for (const line of text.split(/\r?\n/)) {
      dict.add(line);
    }
    return dict;
  }
}
