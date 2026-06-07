# @i18nprune/git — git analytics dashboard

Public SPA at **git.i18nprune.dev** (Cloudflare Pages). Reads the monorepo git history and renders overview metrics, weekly timeline, commit log, and author stats.

## Commands

| Script | Description |
|--------|-------------|
| `pnpm generate:sitemap` | Build `public/sitemap.xml` from synced data |
| `pnpm dev` | Sync data + sitemap, then Vite dev server (port **5190**) |
| `pnpm sync` | Export git log → `src/data/*.json` (skips when git unchanged) |
| `pnpm sync:force` | Full rebuild; clears GitHub profile cache |
| `pnpm validate` | Validate generated `src/data/*.json` + phase config coverage |
| `pnpm validate:data` | Shape/consistency checks for `src/data/*.json` (`scripts/validate/data.ts`) |
| `pnpm validate:phases` | Fail if commits exist in weeks missing from `phases.config.json` (`scripts/validate/phases.ts`) |
| `pnpm build` | SEO assets + sync + validate + sitemap + production build |
| `pnpm typecheck` | Sync + validate + TypeScript check |
| `pnpm deploy` | Build + deploy to Cloudflare Pages |

From repo root: `pnpm git:dev`, `pnpm git:sync`, `pnpm git:sync:force`, `pnpm git:build`, `pnpm git:typecheck`, `pnpm git:deploy`.

## Data sync

`pnpm sync` runs automatically before `dev` and `build`. It writes:

| File | Source |
|------|--------|
| `src/data/commits.json` | Full git log + per-file numstat |
| `src/data/summary.json` | Aggregates (counts, lines, tags, `syncedAt`, `githubRepoUrl`) |
| `src/data/authors.json` | Per-author totals + GitHub profile (`avatarUrl`, `displayName`, followers/following) |
| `src/data/phases.json` | **Merged** output (see below) |
| `src/data/tags.json` | Annotated tags + commit membership |
| `src/data/branches.json` | Branch tips + commit membership |

Everything except phase **narratives** is computed from git on each sync. When `HEAD` and commit count are unchanged, sync **skips** the full parse (see `.cache/sync-state.json`). GitHub profiles use a **TTL cache** (`.cache/github-profiles.json`, 7 days); enriched rows are kept when the API is rate-limited or unreachable. Set **`GITHUB_TOKEN`** for higher rate limits (5000 req/hr vs 60 unauthenticated). Use **`pnpm sync:force`** to bypass the skip path and refresh GitHub cache.

**Git:** `src/data/*.json` is **gitignored** (same idea as `apps/releases`). Sync runs before `dev`, `build`, and `typecheck`, so data always reflects current git history without committing generated JSON after every repo commit.

**SEO:** Uses `@i18nprune/seo` like other Pages apps — favicons, `robots.txt`, `site.webmanifest`, OG images (`/og.svg`, `/og.png` via Cloudflare Functions), rich meta + JSON-LD in `index.html`, and a generated `sitemap.xml` covering overview, list pages, and every commit/author/tag/branch route.

## Timeline / phases

**`scripts/phases.config.json`** and **`src/data/phases.json`** are related but not the same file:

- **`phases.config.json`** — **You maintain this.** Curated weekly blocks: label, theme sentence, color, shipped bullet list. Sync cannot infer these from git.
- **`phases.json`** — **Generated.** Sync merges config with live commit counts per ISO week. The Timeline and Overview charts read this file.

### What sync auto-handles

- Commit counts per week (always fresh from git)
- New weeks with commits get a **fallback** phase (`label: "Week …"`, gray, empty `shipped[]`) so the UI never breaks
- Summary, authors, commits — fully automatic

### What you must add manually

When a **new ISO week** gets commits, add a block to `phases.config.json` with the real label, theme, color, and shipped items. Until then, `pnpm validate` / `pnpm build` **fail** and list the missing week(s).

```bash
pnpm validate   # check only
pnpm sync       # refresh data after editing config
```

### Weekly maintainer workflow

1. After significant work in a new week, run `pnpm git:sync` (or `pnpm git:build` / `pnpm git:typecheck`).
2. If validate/build fails, append a phase entry to `scripts/phases.config.json` and commit **only the config** — sync regenerates `phases.json` locally and at build time.

See also [`maintainer/agents/git.md`](../../maintainer/agents/git.md) § Git analytics timeline.

## Theme

Uses `@i18nprune/ui` `ThemeProvider` with storage key `i18nprune-git-theme`. First visit follows OS light/dark (`index.html` inline script); toggle persists `light` / `dark` in localStorage.

## Deploy

```bash
pnpm deploy
# or from root: pnpm git:deploy
```

Requires Wrangler + Cloudflare Pages project `git-i18nprune`.

**CI:** every push to `main` runs [`.github/workflows/deploy-git.yml`](../../.github/workflows/deploy-git.yml) — `pnpm git:build` (sync + **validate** + build) then Pages deploy. If a new ISO week has commits but no block in `scripts/phases.config.json`, validate fails and deploy is blocked until you commit the config.
