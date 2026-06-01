# Active sprint

**Hub:** [`V1-RELEASE.md`](./V1-RELEASE.md) · **Shipped receipts:** [`shipped-slices.md`](./shipped-slices.md) · **Locked chain:** [§ below](#locked-cross-phase-dependency-chain)

---

## Focus now

| Priority | Session | Doc |
|----------|---------|-----|
| **1 — done** | Cross-platform (XP) — shipped | [`systems/platform.md`](../systems/platform.md) |
| **2 — done** | Tree & naming — **T0–T10 shipped** (receipt only) | [`shipped-slices.md`](./shipped-slices.md) |
| **3 — active** | CI hardening (CI-1…5) | [`ci.md`](./ci.md) |
| **4** | Docs refactor (D) — incl. **D.0 onboarding hub** | [`docs-refactor.md`](./docs-refactor.md) |
| **5** | Release (E + G) | [`final.md`](./final.md) |

---

## Locked cross-phase dependency chain

```txt
… → cross-platform (shipped) → tree (shipped) → ci (active) → docs → release → extension
```

Full chain + role one-liners: [`V1-RELEASE.md`](./V1-RELEASE.md) · Systems maps for shipped verticals: [`systems/README.md`](../systems/README.md).

| Phase | Doc |
|-------|-----|
| **cross-platform** | [`systems/platform.md`](../systems/platform.md) |
| **tree** (shipped) | [`shipped-slices.md`](./shipped-slices.md) |
| **ci** | [`ci.md`](./ci.md) |
| **docs** | [`docs-refactor.md`](./docs-refactor.md) |
| **extension** | [`extension/README.md`](./extension/README.md) |

---

## Guiding rules

- **CI-first:** `validate --json` + stable `issues[]` codes as the default gate.
- **Opt-in mutation:** never patch user project files implicitly.
- **One slice per PR** — scope from the active plan doc only.
- **Edge-case honesty:** [`docs/edge-cases/unsolved/inventory.md`](../../docs/edge-cases/unsolved/inventory.md).
