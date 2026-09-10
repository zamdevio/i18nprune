# Sprint focus

**Shipped receipts:** [`shipped/`](../shipped/README.md)

---

## Focus now

| Priority | Vertical | Doc |
|----------|----------|-----|
| **Now** | Preserve + sync | [`preserve-sync.md`](./preserve-sync.md) |
| **Next** | VS Code extension | [`extension/README.md`](./extension/README.md) |
| **Then** | Extractor v2 | [`extractor/README.md`](./extractor/README.md) |
| **Then** | Locale-only generate | [`locale-only.md`](./locale-only.md) |
| **Queued** | Config layout UX | [`config.md`](./config.md) |
| **Planned** | `search` command | [`search.md`](./search.md) |
| **Research** | Terminal protocol | [`terminal.md`](./terminal.md) |

Engineering maps: [`systems/README.md`](../systems/README.md).

---

## Dependency chain

```txt
preserve-sync → VS Code extension → extractor v2 (AST tier)
  → locale-only generate → search → …
```

Config layout UX (`config.md`) is orthogonal CLI polish — can ship between larger tracks.

---

## Guiding rules

- **CI-first:** `expgov validate` + parity tests on SDK/CLI changes.
- **One concern per PR** — scope from the active plan doc only.
- **No bulk `stable.exact` dumps** — module-by-module reclassification + `@sdkTier` when touching exports.
