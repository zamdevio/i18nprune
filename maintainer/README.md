# Maintainer directory

Contributor-only planning and systems maps. **`docs/`** syncs to the public site; **`maintainer/`** does not.

**Agent guides:** [`agents/README.md`](agents/README.md) · **Onboarding:** [`agents/onboarding.md`](agents/onboarding.md)

---

## Post-v1 maintenance

| Need | Where |
|------|--------|
| **What to build next** | [`phases/active-phase.md`](phases/active-phase.md) — currently **extension** |
| **What not to redo** | [`phases/shipped-slices.md`](phases/shipped-slices.md) |
| **How subsystems wire** | [`systems/README.md`](systems/README.md) |
| **Commit / tag / npm** | [`agents/git.md`](agents/git.md) |
| **Gates before merge** | [`systems/health.md`](systems/health.md) |

**Engine truth:** domain logic in **`packages/core`** (`runXxx`, cache, share, report schema at `src/shared/report/`, subpath `@i18nprune/core/report-schema`). CLI is a thin host. Report SPA is **`apps/report`** (`@i18nprune/report`).

**Scratch:** **`maintainer/temp/`** (gitignored — never commit).

---

## Entrypoints

| Doc | Role |
|-----|------|
| [`phases/active-phase.md`](phases/active-phase.md) | **Current sprint** |
| [`phases/shipped-slices.md`](phases/shipped-slices.md) | Shipped receipts |
| [`phases/extension/README.md`](phases/extension/README.md) | Extension roadmap + specs |
| [`phases/extractor.md`](phases/extractor.md) | Shipped extractor reference (future hardening) |
| [`systems/README.md`](systems/README.md) | Engineering maps (cache, share, ops, commands) |
