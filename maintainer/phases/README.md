# Phases — maintainer hub

**Not on docs site** — `maintainer/phases/` is contributor-only.

---

## Start here

| Doc | Role |
|-----|------|
| [`focus.md`](./focus.md) | **Current sprint focus** |
| [`shipped/`](../shipped/README.md) | Closed slices — **ISO week timeline** |

Scratch / spikes: **`maintainer/temp/`** (gitignored).

---

## Active work (planned only)

| Doc | Status |
|-----|--------|
| [`extension/README.md`](./extension/README.md) | **Next** — VS Code extension (own branch) |
| [`extractor/README.md`](./extractor/README.md) | **Now** — v2 accuracy (HOC → …) |
| [`locale-only.md`](./locale-only.md) | **Then** — generate without config / codebase |
| [`config.md`](./config.md) | **Queued** — `config` layout-aware human + JSON |
| [`search.md`](./search.md) | **Planned** — `search` command |
| [`terminal.md`](./terminal.md) | **Research** — terminal protocol exploitation |

**Systems maps:** [`systems/README.md`](../systems/README.md) — `cache.md`, `share.md`, `extractor.md`, `exports.md`, …

---

## Lifecycle

1. Scope from the **active plan doc** only — one slice per PR.
2. Close slices in [`shipped/`](../shipped/README.md); sync [`apps/git/scripts/phases.config.json`](../../apps/git/scripts/phases.config.json).
3. Session noise → **`maintainer/temp/`** only (not linked from committed docs).
4. **Publish / tag:** [`agents/git.md`](../agents/git.md).
