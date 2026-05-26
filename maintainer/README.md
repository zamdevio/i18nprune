# Maintainer directory

Material here supports **core contributors and repo automation**: ordered release sessions, extension planning, and niche backlog notes. **`pnpm docs:sync`** mirrors only **`docs/`** — nothing under **`maintainer/`** becomes **`docs.i18nprune.dev`** pages.

**Contributor & agent guides → [`maintainer/agents/`](agents/README.md)** (onboarding, architecture, rules, Git discipline).

## Why this stays in git

Ignoring all of **`maintainer/`** would strand clones without sequencing context. Instead:

- **`maintainer/temp/`** is **gitignored** — drop temporary plans, spikes, and session noise there (never commit).
- Everything else remains reviewable history until we deliberately prune it.

## Entrypoints

| Doc | Role |
|-----|------|
| [**`agents/onboarding.md`**](agents/onboarding.md) | **New contributor / agent** — reading order, trace-a-command, PR checklist |
| [**`phases/V1-RELEASE.md`**](phases/V1-RELEASE.md) | Ordered v1 **sessions** (code + docs work) |
| [**`phases/active-phase.md`**](phases/active-phase.md) | Active sprint + **locked** chain (extractor → init → locales → **cache** → translate-cache → extension) |
| [**`phases/final.md`**](phases/final.md) | **One-time pre-publish checklist** (includes ADR polish + repo hygiene); **delete after completion** |
| [**`systems/README.md`**](systems/README.md) | **Internal** tree: **`systems/operations/`**, **`systems/commands/`** — entrypoints, flows, per-op sheets (not user docs) |

**Execution order (v1):** **init (F)** (**shipped**) → **locales (H)** (**shipped**) → **cache (H-cache)** (**shipped**) → **translate-cache (H.1)** (**shipped**) → **apps (C.3)** (**active next**) → **docs (D)** → **landing (D.2)** → **release (E)** + **`final.md` (G)**. See **[`phases/V1-RELEASE.md` § Recommended sequence](phases/V1-RELEASE.md#recommended-v1-sequence-start-here-after-shipped-session-c)**.

**Phase narrative:** [`phases/README.md`](phases/README.md) · **active:** [`phases/apps.md`](phases/apps.md) · **locales reference (H — shipped):** [`phases/locales.md`](phases/locales.md) · **scratch:** **`maintainer/temp/`** only.
