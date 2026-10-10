# Sprint focus

**Shipped receipts:** [`shipped/`](../shipped/README.md)

---

## Focus now

| Priority | Vertical | Doc |
|----------|----------|-----|
| **Now** | Extractor v2 — HOC §A done; resume light-dataflow → cross-file | [`extractor/README.md`](./extractor/README.md) · receipt [`shipped/extractor/hoc-a.md`](../shipped/extractor/hoc-a.md) |
| **Next** | VS Code extension | [`extension/README.md`](./extension/README.md) *(own branch)* |
| **Then** | Locale-only generate | [`locale-only.md`](./locale-only.md) |
| **Queued** | Config layout UX | [`config.md`](./config.md) |
| **Planned** | `search` command | [`search.md`](./search.md) |
| **Research** | Terminal protocol | [`terminal.md`](./terminal.md) |
| **Shipped** | Preserve + sync | [`shipped/locale/preserve-sync.md`](../shipped/locale/preserve-sync.md) |

Engineering maps: [`systems/README.md`](../systems/README.md).

---

## Dependency chain

```txt
preserve-sync (done) → extractor v2 (HOC §A done → light-dataflow → cross-file / AST)
  → locale-only generate → search → …
extension → own branch (does not block core releases)
```

Config layout UX (`config.md`) is orthogonal CLI polish — can ship between larger tracks.

---

## Guiding rules

- **CI-first:** `expgov validate` + parity tests on SDK/CLI changes.
- **One concern per PR** — scope from the active plan doc only.
- **No bulk `stable.exact` dumps** — module-by-module reclassification + `@sdkTier` when touching exports.
