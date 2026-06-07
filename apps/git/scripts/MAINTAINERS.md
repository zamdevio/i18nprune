# apps/git data sync

Regenerates `src/data/*.json` from the monorepo git history. Output is **gitignored** — sync runs before dev, build, and typecheck.

## Commands

```bash
pnpm --filter @i18nprune/git sync
pnpm --filter @i18nprune/git sync:force   # bypass fingerprint skip + clear GitHub cache
```

From repo root: `pnpm git:sync` · `pnpm git:sync:force`

`predev` and `prebuild` run sync automatically.

## Outputs (`src/data/`)

| File | Source |
|------|--------|
| `commits.json` | `git log` + `--numstat` (hash, author, body, files, +/- lines) |
| `summary.json` | Derived totals (commits, authors, peak day, TS/MD line counts, tags) |
| `phases.json` | `scripts/phases.config.json` merged with weekly commit counts |
| `authors.json` | Per-author totals + GitHub profile fields |
| `tags.json` | Annotated tags + commit membership |
| `branches.json` | Branch tips + commit membership |

SPA imports these files only — **not** the cache directory.

## Cache (`.cache/` — gitignored)

Script-only state under `apps/git/.cache/`:

| File | Role |
|------|------|
| `sync-state.json` | `HEAD` + commit-count fingerprint; enables &lt;1s no-op skip when git unchanged |
| `github-profiles.json` | Login-keyed GitHub API cache (7-day TTL, sticky enriched rows on API failure) |

**Policy:**

- `commits.json` and siblings are **exports**, not cache — always regenerated on a full sync.
- Enriched GitHub rows are **never downgraded** to empty fallback when rate-limited or unreachable; stale cache is reused.
- `not_found` entries do not overwrite prior enriched data.
- `--force` clears `github-profiles.json` and always runs a full parse + write.

## Fast path

When `sync-state.json` fingerprint matches current `HEAD` + `rev-list --count` and all six output files exist, sync prints:

```text
Sync skipped (no git changes since …, HEAD abc1234)
```

Rebase / new commits change the fingerprint → full sync runs automatically.

## Validation

```bash
pnpm --filter @i18nprune/git validate          # data shape + phases config
pnpm --filter @i18nprune/git validate:data     # scripts/validate/data.ts
pnpm --filter @i18nprune/git validate:phases   # scripts/validate/phases.ts
```

## GitHub enrichment

`sync` fetches `api.github.com/users/:login` for author avatars and profile fields. Set **`GITHUB_TOKEN`** in the environment for authenticated rate limits (5000 req/hr). Sync logs a summary line: `enriched · not found · cache hit(s) · …`.

Profiles are cached in `.cache/github-profiles.json` for seven days. Expired entries refetch on the next full sync; if the API is down, enriched cache rows are kept.

## Curating phases

Edit `scripts/phases.config.json` for week labels, themes, colors, and shipped chips.  
Re-run sync to refresh commit counts per week from live git data.
