# Active sprint

**Shipped receipts:** [`shipped/`](../shipped/README.md)

---

## Focus now

| Priority | Vertical | Doc |
|----------|----------|-----|
| **Now** | **SDK export tiers (EX-P0 → EX-1…)** | [`exports.md`](./exports.md) — **`expgov validate` green** + CI; **blocks npm v1 publish** |
| **Paused** | Extractor v2 (accuracy tiers) | [`extractor/README.md`](./extractor/README.md) — resume after EX-P0 |
| **Then** | AST tier (opt-in typed assist) | [`extractor/ast-tier.md`](./extractor/ast-tier.md) |
| **Then** | VS Code extension | [`extension/README.md`](./extension/README.md) |
| **Queued** | `search` command | [`search.md`](./search.md) — after S.1 index; overlaps extractor v2 |

**Kits v1.0.0 shipped** — receipt [`shipped/kits/kits.md`](../shipped/kits/kits.md). Git/monorepo version fields at `1.0.0`; **npm publish held** until [`exports.md`](./exports.md) EX-P0 passes.

**On hold:** [`extractor/provider-registry.md`](./extractor/provider-registry.md) (non-JS languages) — only after AST tier + extension are released without regressions.

**v1 product gates (shipped):** cross-platform (XP), tree (T0–T10), CI (CI-1–5), docs (D), kits, release prep (`publish:verify`). **v1 npm gate (open):** EX-P0 export governance — see [`exports.md`](./exports.md).

**Side branch:** [`feat/studio`](../../apps/studio/) — Tauri studio app bootstrap; not on `main` git timeline until merged.

**Parallel research:** [`terminal.md`](./terminal.md) — exploit terminal protocols to surface existing SDK telemetry (titles, OSC progress, hyperlinks, notifications). Does not block EX-P0; ship in small CLI-only slices when active.

---

## Shipped reference (future work only)

| Area | Doc | Role |
|------|-----|------|
| **Exports** | [`exports.md`](./exports.md) | Active — expgov tiering + npm v1 gate |
| **Extractor** | [`extractor/README.md`](./extractor/README.md) | Shipped baseline + v2 program + deferred provider registry |
| **Extension** | [`extension/README.md`](./extension/README.md) | Post–AST-tier vertical — `apps/extension/` |
| **Search** | [`search.md`](./search.md) | Planned read-only key ↔ call-site op |
| **Terminal** | [`terminal.md`](./terminal.md) | Research — protocol exploitation (presentation only; parallel track) |

---

## Dependency chain (historical → next)

```txt
… → kits v1 (shipped) → exports EX-P0 (npm gate) → EX-1…EX-3 (barrel refactor; 2.0 at slim) → extractor v2 → search → AST tier → extension
```

Engineering maps: [`systems/README.md`](../systems/README.md) (`platform.md`, `ci.md`, `cache.md`, `share.md`, `extractor.md`, `exports.md`, …).

---

## Guiding rules

- **CI-first:** `validate --json` + stable `issues[]` codes as the default gate; **`expgov validate`** for SDK surface.
- **Opt-in mutation:** never patch user project files implicitly.
- **One slice per PR** — scope from the active plan doc only (`exports.md` while EX-P0 / tiering is active).
- **No npm v1** until EX-P0 exit criteria in [`exports.md`](./exports.md).
- **Edge-case honesty:** [`docs/edge-cases/unsolved/inventory.md`](../../docs/edge-cases/unsolved/inventory.md).
