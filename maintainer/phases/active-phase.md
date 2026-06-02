# Active sprint

**Hub:** [`final.md`](./final.md) · **Shipped receipts:** [`shipped-slices.md`](./shipped-slices.md)

---

## Focus now

| Priority | Session | Doc |
|----------|---------|-----|
| **1 — done** | Cross-platform (XP) — shipped | [`systems/platform.md`](../systems/platform.md) |
| **2 — done** | Tree & naming — **T0–T10 shipped** (receipt only) | [`shipped-slices.md`](./shipped-slices.md) |
| **3 — done** | CI hardening (CI-1–5 shipped, incl. Turborepo in fa92505) | [`systems/ci.md`](../systems/ci.md) |
| **4 — done** | Docs (D) — completed | [`shipped-slices.md`](./shipped-slices.md) |
| **5 — active** | Release (E + G) | [`final.md`](./final.md) |

---

## Locked cross-phase dependency chain

```txt
… → cross-platform (shipped) → tree (shipped) → ci (shipped) → docs (done) → release → extension
```

Chain + role one-liners are captured in this file; systems maps for shipped verticals: [`systems/README.md`](../systems/README.md).

| Phase | Doc |
|-------|-----|
| **cross-platform** | [`systems/platform.md`](../systems/platform.md) |
| **tree** (shipped) | [`shipped-slices.md`](./shipped-slices.md) |
| **ci** (shipped) | [`systems/ci.md`](../systems/ci.md) |
| **docs** (done) | [`shipped-slices.md`](./shipped-slices.md) |
| **extension** | [`extension/README.md`](./extension/README.md) |

---

## Guiding rules

- **CI-first:** `validate --json` + stable `issues[]` codes as the default gate.
- **Opt-in mutation:** never patch user project files implicitly.
- **One slice per PR** — scope from the active plan doc only.
- **Edge-case honesty:** [`docs/edge-cases/unsolved/inventory.md`](../../docs/edge-cases/unsolved/inventory.md).
