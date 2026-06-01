# Active sprint

**Hub:** [`V1-RELEASE.md`](./V1-RELEASE.md) · **Shipped receipts:** [`shipped-slices.md`](./shipped-slices.md) · **Locked chain:** [§ below](#locked-cross-phase-dependency-chain)

---

## Focus now

| Priority | Session | Doc |
|----------|---------|-----|
| **1 — active** | Cross-platform (XP) — XP-0/1/2 code shipped; matrix gate + XP-3…7 open | [`cross-platform.md`](./cross-platform.md) |
| **2 — next** | Tree & naming | [`tree.md`](./tree.md) |
| **3** | Docs refactor (D) — incl. **D.0 onboarding hub** | [`docs-refactor.md`](./docs-refactor.md) |
| **4** | Release (E + G) | [`final.md`](./final.md) |

---

## Locked cross-phase dependency chain

```txt
… → apps (shipped) → cross-platform (active) → tree (planned) → docs → release → extension
```

Full chain + role one-liners: [`V1-RELEASE.md`](./V1-RELEASE.md) · Systems maps for shipped verticals: [`systems/README.md`](../systems/README.md).

| Phase | Doc |
|-------|-----|
| **cross-platform** | [`cross-platform.md`](./cross-platform.md) |
| **tree** | [`tree.md`](./tree.md) |
| **docs** | [`docs-refactor.md`](./docs-refactor.md) |
| **extension** | [`extension/README.md`](./extension/README.md) |

---

## Guiding rules

- **CI-first:** `validate --json` + stable `issues[]` codes as the default gate.
- **Opt-in mutation:** never patch user project files implicitly.
- **One slice per PR** — scope from the active plan doc only.
- **Edge-case honesty:** [`docs/edge-cases/unsolved/inventory.md`](../../docs/edge-cases/unsolved/inventory.md).
