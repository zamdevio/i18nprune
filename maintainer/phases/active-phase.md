# Active sprint

**Shipped receipts:** [`shipped-slices.md`](./shipped-slices.md)

---

## Focus now

| Priority | Vertical | Doc |
|----------|----------|-----|
| **Now** | Extractor v2 (accuracy tiers) | [`extractor/README.md`](./extractor/README.md) → start [`extractor/hoc.md`](./extractor/hoc.md) |
| **Then** | AST tier (opt-in typed assist) | [`extractor/ast-tier.md`](./extractor/ast-tier.md) |
| **Then** | VS Code extension | [`extension/README.md`](./extension/README.md) |
| **Queued** | `search` command | [`search.md`](./search.md) — after S.1 index; overlaps extractor v2 |

**On hold:** [`extractor/provider-registry.md`](./extractor/provider-registry.md) (non-JS languages) — only after AST tier + extension are released without regressions.

**v1 gate closed:** cross-platform (XP), tree (T0–T10), CI (CI-1–5), docs (D), release prep (npm `@i18nprune/core` + `publish:verify`). Extractor hardening C.1 / E.1–E.6 / D.1 shipped — see [`extractor/README.md`](./extractor/README.md).

---

## Shipped reference (future work only)

| Area | Doc | Role |
|------|-----|------|
| **Extractor** | [`extractor/README.md`](./extractor/README.md) | Shipped baseline + v2 program + deferred provider registry |
| **Extension** | [`extension/README.md`](./extension/README.md) | Post–AST-tier vertical — `apps/extension/` |
| **Search** | [`search.md`](./search.md) | Planned read-only key ↔ call-site op |

---

## Dependency chain (historical → next)

```txt
… → release (shipped) → extractor v2 → search (read-only index) → AST tier → extension → provider registry (on hold)
```

Engineering maps: [`systems/README.md`](../systems/README.md) (`platform.md`, `ci.md`, `cache.md`, `share.md`, `extractor.md`, …).

---

## Guiding rules

- **CI-first:** `validate --json` + stable `issues[]` codes as the default gate.
- **Opt-in mutation:** never patch user project files implicitly.
- **One slice per PR** — scope from the active plan doc only (`extractor/` specs while extractor v2 is active).
- **Edge-case honesty:** [`docs/edge-cases/unsolved/inventory.md`](../../docs/edge-cases/unsolved/inventory.md).
