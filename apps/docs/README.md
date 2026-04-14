# i18nprune documentation site

Next.js + [Nextra](https://nextra.site) app under **`apps/docs`**. **`content/` is generated** — edit markdown in the repository **`docs/`** folder at the repo root only. Sync copies `../../docs` → `content/`.

## Links

| Resource | URL |
|----------|-----|
| **Live docs** | [docs.i18nprune.dev](https://docs.i18nprune.dev) |
| **Repository** | [github.com/zamdevio/i18nprune](https://github.com/zamdevio/i18nprune) |
| **npm** | [npmjs.com/package/@zamdevio/i18nprune](https://www.npmjs.com/package/@zamdevio/i18nprune) |

## Scripts

Run from **`apps/docs`** after **`pnpm install` at the repository root** (installs all workspaces):

| Command | Purpose |
|---------|---------|
| `pnpm run sync` | Copy `../../docs` → `content/` |
| `pnpm run dev` | Sync once, then dev server on port **8181** |
| `pnpm run build` | Sync + static export to `out/` (Pagefind in `postbuild`) |

From the **repository root**:

| Command | Purpose |
|---------|---------|
| `pnpm docs:sync` | Runs `node apps/docs/scripts/sync-content.js` (same copy as `pnpm run sync` inside `apps/docs`) |
| `pnpm docs:dev` | `pnpm --filter @zamdevio/i18nprune-docs dev` |
| `pnpm docs:build` | `pnpm --filter @zamdevio/i18nprune-docs build` |

## Deploy

Static output is **`apps/docs/out/`** after `pnpm docs:build` (or `pnpm run build` inside `apps/docs`). Point any static host at that directory.

From the **repository root**, Cloudflare Pages deploy names live in **`package.json`** (no per-app `wrangler` config required):

- `pnpm docs:deploy` — runs `docs:build`, then `wrangler pages deploy apps/docs/out --project-name=docs-i18nprune` (default host `docs-i18nprune.pages.dev`; attach custom domain `docs.i18nprune.dev` in the dashboard).

**Monorepo note:** `next.config.mjs` sets `turbopack.root` to the repo root so `pnpm docs:build` resolves `next` under pnpm workspaces (Next.js 16 + Turbopack).

## Source of truth

- **Authoritative docs:** [`../../docs`](../../docs) (repo root `docs/`)
- **Edit on GitHub:** `docsRepositoryBase` in `app/layout.tsx` → `https://github.com/zamdevio/i18nprune/tree/main/docs`

## Related workspaces

- **Report contract (Zod + types):** [`../../packages/report`](../../packages/report) — consumed as `@zamdevio/i18nprune/report` from the main package.
- **Report SPA (HTML UI):** [`../../apps/report`](../../apps/report) — built with Vite; not the docs app.
