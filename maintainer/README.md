# Maintainer directory

Contributor-only planning and systems maps. **`docs/`** syncs to the public site; **`maintainer/`** does not.

**Agent guides:** [`agents/README.md`](agents/README.md) · **Onboarding:** [`agents/onboarding.md`](agents/onboarding.md)

---

## Post-v1 maintenance

| Need | Where |
|------|--------|
| **What to build next** | [`phases/focus.md`](phases/focus.md) — preserve-sync, then extension → extractor → locale-only |
| **What not to redo** | [`shipped/README.md`](shipped/README.md) |
| **How subsystems wire** | [`systems/README.md`](systems/README.md) |
| **Commit / tag / npm** | [`agents/git.md`](agents/git.md) |
| **Gates before merge** | [`systems/health.md`](systems/health.md) |

**Engine truth:** domain logic in **`packages/core`** (`runXxx`, cache, share, report schema at `src/shared/report/`, subpath `@i18nprune/core/report-schema`). CLI is a thin host. Report SPA is **`apps/report`** (`@i18nprune/report`).

**Scratch:** **`maintainer/temp/`** (gitignored — never commit).

---

## Entrypoints

| Doc | Role |
|-----|------|
| [`phases/focus.md`](phases/focus.md) | **Current sprint** |
| [`shipped/README.md`](shipped/README.md) | Shipped receipts (ISO weeks + topic groups) |
| [`phases/extension/README.md`](phases/extension/README.md) | Extension roadmap + specs |
| [`phases/extractor/README.md`](phases/extractor/README.md) | Extractor hub — shipped receipts + v2 phases |
| [`phases/extractor/architecture.md`](phases/extractor/architecture.md) | Extractor engines, normalizer, incremental cache |
| [`phases/extractor/guardrails.md`](phases/extractor/guardrails.md) | Extractor safety & PR checklist |
| [`phases/search.md`](phases/search.md) | Planned `search` command phase |
| [`shipped/exports/governance.md`](shipped/exports/governance.md) | Export governance — expgov + validate CI (shipped) |
| [`shipped/exports/tiers.md`](shipped/exports/tiers.md) | Honest tier classification (in progress) |
| [`shipped/exports/program.md`](shipped/exports/program.md) | Barrel refactor program |
| [`phases/terminal.md`](phases/terminal.md) | Terminal protocol exploitation (CLI presentation; research) |
| [`systems/exports.md`](systems/exports.md) | Export system rules + host matrix |
| [`systems/README.md`](systems/README.md) | Engineering maps (cache, share, ops, commands) |
