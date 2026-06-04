# Active sprint

**Shipped receipts:** [`shipped-slices.md`](./shipped-slices.md)

---

## Focus now

| Priority | Vertical | Doc |
|----------|----------|-----|
| **Next** | VS Code extension | [`extension/README.md`](./extension/README.md) |

**v1 gate closed:** cross-platform (XP), tree (T0–T10), CI (CI-1–5), docs (D), release prep (npm `@i18nprune/core` + `publish:verify`, maintainer publish checklist in [`agents/git.md`](../agents/git.md)). Receipts in [`shipped-slices.md`](./shipped-slices.md).

---

## Shipped reference (future work only)

| Area | Doc | Role |
|------|-----|------|
| **Extractor** | [`extractor.md`](./extractor.md) | Session C.1 **shipped** — kept for hardening ideas + [`inventory`](../../docs/edge-cases/unsolved/inventory.md) cross-links; not an active sprint blocker |
| **Extension** | [`extension/README.md`](./extension/README.md) | **Active post-v1** vertical — `apps/extension/` |

---

## Dependency chain (historical → next)

```txt
… → cross-platform → tree → ci → docs → release (shipped) → extension
```

Engineering maps for shipped verticals: [`systems/README.md`](../systems/README.md) (`platform.md`, `ci.md`, `cache.md`, `share.md`, `extractor.md`, …).

---

## Guiding rules

- **CI-first:** `validate --json` + stable `issues[]` codes as the default gate.
- **Opt-in mutation:** never patch user project files implicitly.
- **One slice per PR** — scope from the active plan doc only (`extension/` specs while extension is active).
- **Edge-case honesty:** [`docs/edge-cases/unsolved/inventory.md`](../../docs/edge-cases/unsolved/inventory.md).
