# apps/git data sync

Regenerates `src/data/*.json` from the monorepo git history. Output is **gitignored** — sync runs before dev, build, and typecheck.

## Commands

```bash
pnpm --filter @i18nprune/git sync
```

`predev` and `prebuild` run sync automatically.

## Outputs

| File | Source |
|------|--------|
| `commits.json` | `git log` + `--numstat` (hash, author, body, files, +/- lines) |
| `summary.json` | Derived totals (commits, authors, peak day, TS/MD line counts, tags) |
| `phases.json` | `scripts/phases.config.json` merged with weekly commit counts |
| `tags.json` | Annotated tags + commit membership |
| `branches.json` | Branch tips + commit membership |

Output is **gitignored** — sync runs before dev, build, and typecheck.

`pnpm generate:sitemap` writes `public/sitemap.xml` (gitignored) from synced data after each sync in dev/build.

## Curating phases

Edit `scripts/phases.config.json` for week labels, themes, colors, and shipped chips.  
Re-run sync to refresh commit counts per week from live git data.
