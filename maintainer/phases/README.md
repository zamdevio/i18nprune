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
| [`extractor/ast.md`](./extractor/ast.md) | **Now** — opt-in `typed` + finite-keys Track B |
| [`extractor/registry.md`](./extractor/registry.md) | **Next** — non-JS providers; Python first after AST |
| [`serve.md`](./serve.md) | **Shipped** — S.1–S.5; HTTP dismissed ([`systems/serve.md`](../systems/serve.md)) |
| [`extractor/README.md`](./extractor/README.md) | Hub — heuristic v2 shipped; open = ast → registry |
| [`extension/README.md`](./extension/README.md) | After registry track — VS Code extension (own branch) |
| [`locale-only.md`](./locale-only.md) | Locale-only generate |
| [`config.md`](./config.md) | Queued — `config` layout-aware human + JSON |
| [`search.md`](./search.md) | Planned — `search` command |
| [`terminal.md`](./terminal.md) | Research — terminal protocol exploitation |

**Systems maps:** [`systems/README.md`](../systems/README.md) — `cache.md`, `share.md`, `extractor.md`, `exports.md`, …

---

## Lifecycle

1. Scope from the **active plan doc** only — one slice per PR.
2. Close slices in [`shipped/`](../shipped/README.md); sync [`apps/git/scripts/phases.config.json`](../../apps/git/scripts/phases.config.json).
3. Session noise → **`maintainer/temp/`** only (not linked from committed docs).
4. Reproduced defects → [`bugs.md`](./bugs.md) (not a phase doc). Move the entry to `shipped/` when the fix lands — the register must not accumulate fixed bugs.
5. **Publish / tag:** [`agents/git.md`](../agents/git.md).
