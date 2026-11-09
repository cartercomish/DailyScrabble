# Manifest

A daily harbor word puzzle. Everyone gets the same dock and three holds of letter crates. Stow connected words. Beat the cargo quota. Share your manifest.

## Develop

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Generate puzzles

```bash
pnpm gen -- --date 2026-11-10
pnpm gen -- --date 2026-11-10 --batch 30
pnpm craft
```

Puzzles write to `content/puzzles/YYYY-MM-DD.json`.

## Monorepo

- `apps/web` — Next.js mobile-first dock UI
- `packages/engine` — board, scoring, dictionary, solver
- `packages/generator` — CLI to queue daily manifests
- `content/puzzles` — date-keyed puzzle JSON
- `content/words.txt` — common English word list (~15k)

Internal package scope remains `@daily-rack/*` for now; product brand is **Manifest**.
