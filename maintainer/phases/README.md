# Phases — maintainer hub

**Not on docs site** — `maintainer/phases/` is contributor-only.

---

## Start here

| Doc | Role |
|-----|------|
| [`focus.md`](./focus.md) | **Current sprint focus** |
| [`bugs.md`](./bugs.md) | **Open defect register** — reproduced bugs only; delete an entry when its fix ships |
| [`shipped/`](../shipped/README.md) | Closed slices — **ISO week timeline** |

Scratch / spikes: **`maintainer/temp/`** (gitignored).

---

## Active work (planned only)

| Doc | Status |
|-----|--------|
| [`extractor/README.md`](./extractor/README.md) | **Now** — close-out: HOC §B → AST/`typed` (finite-keys A shipped; then release with serve) |
| [`serve.md`](./serve.md) | **Closing** — S.1–S.5 landed; S.6 optional HTTP in the same close-out ([ADR 012](../../docs/architecture/decisions/012-cli-serve-transport.md)) |
| [`extension/README.md`](./extension/README.md) | **Next** (after release) — VS Code extension (own branch) |
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
4. Reproduced defects → [`bugs.md`](./bugs.md) (not a phase doc). Move the entry to `shipped/` when the fix lands — the register must not accumulate fixed bugs.
5. **Publish / tag:** [`agents/git.md`](../agents/git.md).
