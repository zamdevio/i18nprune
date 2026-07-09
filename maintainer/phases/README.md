# Phases — maintainer hub

**Not on docs site** — `maintainer/phases/` is contributor-only.

---

## Start here

| Doc | Role |
|-----|------|
| [`active-phase.md`](./active-phase.md) | **Current sprint focus** |
| [`shipped-slices.md`](./shipped-slices.md) | Closed slices — **ISO week timeline**; check before re-implementing |

Scratch / spikes: **`maintainer/temp/`** (gitignored).

---

## Active work

| Doc | Status |
|-----|--------|
| [`kits.md`](./kits.md) | **Active — v0.1.5** — native `i18nprune kits …` (replaces external toolkit) |
| [`extractor/README.md`](./extractor/README.md) | **Extractor v2** — HOC, light-dataflow, cross-file, finite-keys, AST tier |
| [`extractor/architecture.md`](./extractor/architecture.md) | **Architecture** — engines, normalizer, incremental cache |
| [`search.md`](./search.md) | **Planned** — `search` command (key ↔ call-site index; read-only) |
| [`extension/README.md`](./extension/README.md) | **After AST tier** — VS Code extension (`apps/extension/`) |
| [`exports.md`](./exports.md) | **Planned** — `@i18nprune/core` stability tiers + subpaths (major breaking) |
| [`terminal.md`](./terminal.md) | **Research / planned** — terminal protocol exploitation (CLI presentation; SDK telemetry surfaces) |

**Shipped reference (do not re-implement):**

| Doc | Role |
|-----|------|
| [`extractor/README.md`](./extractor/README.md) | C.1 + E.1–E.6 + D.1 receipts + v2 sequencing |
| [`extractor/architecture.md`](./extractor/architecture.md) | Normalizer, depths, cache model |
| [`extension/`](./extension/) | Extension specs (execute per extension README when active) |

**Systems maps (engineering truth):** [`systems/README.md`](../systems/README.md) — `cache.md`, `share.md`, `extractor.md`, …

---

## Lifecycle

1. Scope from the **active plan doc** only — one slice per PR.
2. Close slices in [`shipped-slices.md`](./shipped-slices.md) under the matching **ISO week**; sync [`apps/git/scripts/phases.config.json`](../../apps/git/scripts/phases.config.json); fold durable notes into [`systems/`](../systems/).
3. Session noise → **`maintainer/temp/`** only.
4. **Publish / tag:** checklist in [`agents/git.md`](../agents/git.md) (no separate phase file).
