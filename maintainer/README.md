# Maintainer directory

Material here supports **core contributors and repo automation**: ordered release sessions, extension planning, and niche backlog notes. **`pnpm docs:sync`** mirrors only **`docs/`** — nothing under **`maintainer/`** becomes **`docs.i18nprune.dev`** pages.

## Why this stays in git

Ignoring all of **`maintainer/`** would strand clones without sequencing context. Instead:

- **`maintainer/temp/`** is **gitignored** — drop temporary plans, spikes, and session noise there (never commit).
- Everything else remains reviewable history until we deliberately prune it.

## Entrypoints

| Doc | Role |
|-----|------|
| [**`phases/V1-RELEASE.md`**](phases/V1-RELEASE.md) | Ordered v1 **sessions** (code + docs work) |
| [**`phases/active-phase.md`**](phases/active-phase.md) | Active sprint + **locked** dependency chain (extractor → init → locales → extension) |
| [**`phases/final.md`**](phases/final.md) | **One-time pre-publish checklist** (includes ADR polish + repo hygiene); **delete after completion** |
| [**`systems/README.md`**](systems/README.md) | **Internal** tree: **`systems/operations/`**, **`systems/commands/`** — entrypoints, flows, per-op sheets (not user docs) |

**Phase narrative:** [`phases/README.md`](phases/README.md) · **onboarding / locales (planned):** [`phases/init.md`](phases/init.md), [`phases/locales.md`](phases/locales.md) · **scratch:** **`maintainer/temp/`** only.
