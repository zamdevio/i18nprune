# Development workflow

From the **repository root**:

| Command | Purpose |
|--------|---------|
| `pnpm install` | Install dependencies |
| `pnpm typecheck` | Monorepo gate — orchestrates `core`, `cli`, and per-app checks (`web:typecheck`, `landing:typecheck`, `docs:typecheck`, `report:typecheck`, worker `build`, extension webview, …) |
| `pnpm test` | Vitest |
| `pnpm build` | Production build chain — CLI (includes embedded report HTML via `cli:build`), `web`, `landing`, `docs`, `extension`, worker compile gates (see root `package.json`) |
| `pnpm cli:build` | `tsup` → `dist/` only (run before **`pnpm test`** if integration tests execute **`dist/cli.js`**) |
| `pnpm dev -- --help` | Run CLI via `tsx` |
| `pnpm generate:languages` | Regenerate `languages.json` |
| `pnpm docs:sync` | One-shot copy `docs/` → `apps/docs/content/` |
| `pnpm docs:dev` | VitePress dev (**port `8282`**, or next free if busy) plus **live sync** — edits under `docs/` mirror into `apps/docs/content/` (`apps/docs/scripts/dev.mjs`) |
| `pnpm --filter @i18nprune/docs dev:no-watch` | One **`sync`** then VitePress only (no file watcher) |
| `pnpm web:dev` | Runtime web console (`apps/web`, `web.i18nprune.dev`) |
| `pnpm web:build` | Production build of runtime web (`apps/web/dist`) |
| `pnpm landing:dev` | Product landing site (`apps/landing`) |
| `pnpm landing:build` | Production build of landing (`apps/landing/dist`) |
| `pnpm report:dev` | Report SPA dev (`apps/report`) |
| `pnpm report:build` | Report SPA bundle (`apps/report/dist`) — also run via `cli:build` |
| `pnpm git:dev` | Git analytics SPA dev (`apps/git`, `git.i18nprune.dev`, port **5190**) |
| `pnpm git:build` | Git analytics production build (`apps/git/dist`) |
| `pnpm docs:build` | Static export |

**Docs site navigation:** the left nav is **hand-curated** in `apps/docs/.vitepress/sidebar.ts` (plus top **nav** in `config.mts`). After significant `docs/` IA moves, update those entries so the sidebar matches new paths.

Authoritative prose lives under **`docs/`**. Use **`pnpm docs:dev`** for normal editing (watch keeps **`content/`** in sync). For a single export without starting the server, run **`pnpm docs:sync`**.
