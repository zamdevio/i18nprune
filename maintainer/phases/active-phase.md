# Active sprint

**Shipped receipts:** [`shipped/`](../shipped/README.md)

---

## Focus now

| Priority | Vertical | Doc |
|----------|----------|-----|
| **Now** | VS Code extension | [`extension/README.md`](./extension/README.md) |
| **Paused** | Extractor v2 | [`extractor/README.md`](./extractor/README.md) |
| **Planned** | `search` command | [`search.md`](./search.md) |
| **Research** | Terminal protocol | [`terminal.md`](./terminal.md) |

Engineering maps: [`systems/README.md`](../systems/README.md).

---

## Dependency chain

```txt
VS Code extension → extractor v2 (AST tier) → search → …
```

---

## Guiding rules

- **CI-first:** `expgov validate` + parity tests on SDK/CLI changes.
- **One concern per PR** — scope from the active plan doc only.
- **No bulk `stable.exact` dumps** — module-by-module reclassification + `@sdkTier` when touching exports.
