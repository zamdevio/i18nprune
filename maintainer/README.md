# Maintainer directory

Material here supports **core contributors and repo automation**: ordered release sessions, extension planning, and niche backlog notes. **`pnpm docs:sync`** mirrors only **`docs/`** — nothing under **`maintainer/`** becomes **`docs.i18nprune.dev`** pages.

## Why this stays in git

Ignoring all of **`maintainer/`** would strand clones without sequencing context. Instead:

- **`maintainer/temp/`** is **gitignored** — drop temporary plans, spikes, and session noise there (never commit).
- Everything else remains reviewable history until we deliberately prune it.

## Entrypoints

| Doc | Role |
|-----|------|
| [**`V1-RELEASE.md`**](V1-RELEASE.md) | Ordered v1 **sessions** (code + docs work) |
| [**`final.md`**](final.md) | **One-time pre-publish checklist** (includes ADR polish + repo hygiene); **delete after completion** |
| [**`MIGRATION.md`**](MIGRATION.md) | Core vs CLI extraction backlog |
| [**`OPERATIONS.md`**](OPERATIONS.md) | **`run.*`** events, core vs CLI boundaries |
| [**`systems/README.md`**](systems/README.md) | **Internal** tree: **`systems/operations/`**, **`systems/commands/`** — entrypoints, flows, per-op sheets (not user docs) |

**Phase narrative:** [`phases/README.md`](phases/README.md) · **scratch:** **`maintainer/temp/`** only.
