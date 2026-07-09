# Phases — maintainer hub

**Not on docs site** — `maintainer/phases/` is contributor-only.

---

## Start here

| Doc | Role |
|-----|------|
| [`active-phase.md`](./active-phase.md) | **Current sprint focus** |
| [`shipped/`](../shipped/README.md) | Closed slices — **ISO week timeline** |

Scratch / spikes: **`maintainer/temp/`** (gitignored).

---

## Active work

| Doc | Status |
|-----|--------|
| [`shipped/exports/tiers.md`](../shipped/exports/tiers.md) | **Honest expgov tier classification** (in progress) |
| [`shipped/exports/program.md`](../shipped/exports/program.md) | **Barrel refactor** — subpaths, host migration, root slim |
| [`extractor/README.md`](./extractor/README.md) | **Extractor v2** — paused until export barrels land |
| [`search.md`](./search.md) | **Planned** — `search` command |
| [`extension/README.md`](./extension/README.md) | **After AST tier** — VS Code extension |
| [`terminal.md`](./terminal.md) | **Research** — terminal protocol exploitation |

**Systems maps:** [`systems/README.md`](../systems/README.md) — `cache.md`, `share.md`, `extractor.md`, `exports.md`, …

---

## Lifecycle

1. Scope from the **active plan doc** only — one slice per PR.
2. Close slices in [`shipped/`](../shipped/README.md); sync [`apps/git/scripts/phases.config.json`](../../apps/git/scripts/phases.config.json).
3. Session noise → **`maintainer/temp/`** only (not linked from committed docs).
4. **Publish / tag:** [`agents/git.md`](../agents/git.md).
