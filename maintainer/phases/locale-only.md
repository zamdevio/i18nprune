# Locale-only / config-light generate — phase plan

**Status:** **planned** — after extension + extractor v2.  
**Tracker:** [`focus.md`](./focus.md) · **Receipts:** [`shipped/README.md`](../shipped/README.md) (when shipped).

**Goal:** Run **`generate`** (and related sync/fill flows) against **locale JSON alone** — no JS/TS codebase scan and no required `i18nprune.config.*` — so non-JS projects and bare locale trees can use i18nprune.

---

## Problem

Today the CLI assumes a project: config file, `srcRoot`, extractor scan. That blocks:

- Python / Ruby / Go / etc. apps with only locale directories
- Ad-hoc locale trees (CI job, translation handoff) with no repo checkout
- Quick MT fill when the only inputs are **source locale + target langs + layout**

---

## Product shape

| Input | Behavior |
|-------|----------|
| **Flag** (name TBD, e.g. `--locales-only` / `--locale-dir`) | Bypass codebase scan; take **locale directory** (+ optional layout) |
| **Layout explicit** | `--locales-mode` / `--locales-structure` (or equivalent) when auto-detect is ambiguous |
| **Layout auto-detect** | Infer flat vs locale_directory vs feature_bundle from on-disk shape when unambiguous |
| **Ambiguous / fail** | Stop with a clear prompt: pass layout via flags (no silent wrong mode) |
| **No config file** | Allowed in this mode — flags + detected layout are enough for generate |

**Generate contract in this mode:** source locale language + target langs + locale tree layout → fill/resume targets. No unused-key cleanup against `src/` unless a codebase is later provided.

---

## Remaining

| # | Slice | Outcome |
|---|-------|---------|
| **L0** | **CLI flag + host path** | Enter locale-only mode without config; resolve locale dir + layout (detect or flags). |
| **L1** | **Core generate without scan** | `generate` / resume path works from locale tree + declared source/targets only. |
| **L2** | **Auto-detect + failure UX** | Deterministic detection rules; on conflict, exit non-zero and ask for flags. |
| **L3** | **Docs + fixture** | User docs; minimal fixture (flat + one multi-segment). |
| **L4** | **Validate** | Dogfood on a **Python** (or other non-JS) i18n project: locale dir only → `generate` fills targets. |

---

## Acceptance

1. No `i18nprune.config.*` in cwd → locale-only flag + locale dir still runs `generate`.
2. Unambiguous tree → layout auto-detected; ambiguous → error names the flags to pass.
3. Python (or similar) project with locale JSON only can fill targets without a JS `srcRoot`.
4. Existing config-based projects unchanged (parity).

## Non-goals

- Full unused-key / validate-against-code for non-JS extractors in this phase.
- Replacing config for normal JS/TS monorepos.

---

## Related

- Locale layout: `docs/config/` · `packages/core/src/types/locales/layout.ts`
- Generate: [`systems/commands/generate.md`](../systems/commands/generate.md)
- Sync shape (when locale-only sync is needed later): [`preserve-sync.md`](./preserve-sync.md)
