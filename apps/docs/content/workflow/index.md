# Development workflow

From the **repository root**:

| Command | Purpose |
|--------|---------|
| `pnpm install` | Install dependencies |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm build` | `tsup` → `dist/` (run before **`pnpm test`** if you use integration tests that execute **`dist/cli.js`**) |
| `pnpm dev -- --help` | Run CLI via `tsx` |
| `pnpm generate:languages` | Regenerate `languages.json` |
| `pnpm docs:sync` | One-shot copy `docs/` → `apps/docs/content/` |
| `pnpm docs:dev` | VitePress dev (**port `8282`**, or next free if busy) plus **live sync** — edits under `docs/` mirror into `apps/docs/content/` (`apps/docs/scripts/dev.mjs`) |
| `pnpm --filter @i18nprune/docs dev:no-watch` | One **`sync`** then VitePress only (no file watcher) |
| `pnpm web:dev` | Landing site (`apps/web`, port 5174) |
| `pnpm web:build` | Production build of landing (`apps/web/dist`) |
| `pnpm docs:build` | Static export |

**Docs site navigation:** the left nav is **hand-curated** in `apps/docs/.vitepress/sidebar.ts` (plus top **nav** in `config.mts`). After significant `docs/` IA moves, update those entries so the sidebar matches new paths.

Authoritative prose lives under **`docs/`**. Use **`pnpm docs:dev`** for normal editing (watch keeps **`content/`** in sync). For a single export without starting the server, run **`pnpm docs:sync`**.
