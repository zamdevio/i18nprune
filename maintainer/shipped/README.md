# Shipped work

Closed slices only — check here before re-implementing. Durable engineering detail lives in [`systems/`](../systems/README.md).

**Portal mirror:** [`apps/git/scripts/phases.config.json`](../../apps/git/scripts/phases.config.json) (`git.i18nprune.dev` timeline). When you close a slice, add a matching `shipped[]` bullet in the same ISO week.

**Convention:** Weeks use **ISO-8601** (`YYYY-Www`, Monday start). Newest weeks first below.

**Next work:** Extractor v2 — [`phases/extractor/README.md`](../phases/extractor/README.md) · then search · AST tier · extension — [`phases/active-phase.md`](../phases/active-phase.md).

---

## Timeline (ISO weeks)

| Week | Theme | Doc |
|------|-------|-----|
| 2026-W28 | **Kits v1.0.0** + export publish preflight | [`kits/kits.md`](./kits/kits.md) · [`exports/governance.md`](./exports/governance.md) |
| 2026-W26 | Tooling & kits prep (expgov migration, pnpm v11) | [`tooling/tooling.md`](./tooling/tooling.md) |
| 2026-W25 | Export governance bootstrap, extractor/search phases | [`tooling/tooling.md`](./tooling/tooling.md) |
| 2026-W24 | Extractor fusion E.1–E.6, D.1, T.1 | [`extractor/fusion.md`](./extractor/fusion.md) |
| 2026-W23 | Release & platform (CI, XP, tree, npm, git portal) | [`platform/platform.md`](./platform/platform.md) · [`platform/ci.md`](./platform/ci.md) |
| 2026-W22 | Share + worker + web/report UX | [`share/share.md`](./share/share.md) |
| 2026-W21 | Hardening (C.1, patching, init, locales, UI, cache) | [`extractor/c1.md`](./extractor/c1.md) · [`cache/init.md`](./cache/init.md) |
| 2026-W20 | Generate/resume engine, translate cache, core ops | [`cache/generate.md`](./cache/generate.md) · [`cache/cache.md`](./cache/cache.md) |
| 2026-W19 | Core package, docs scaffold, apps | [`core/core.md`](./core/core.md) |
| 2026-W16 | pnpm workspace | [`core/core.md`](./core/core.md) |
| 2026-W15 | Genesis CLI surface | [`core/core.md`](./core/core.md) |

---

## Slice ID index

| ID | Week | One-line | Doc |
|----|------|----------|-----|
| **Kits v1** | W28 | Native `i18nprune kits` + semver 1.0.0 | [`kits/kits.md`](./kits/kits.md) |
| **Publish preflight** | W28 | expgov validate + npm v1 gate | [`exports/governance.md`](./exports/governance.md) |
| **Governance bootstrap** | W25 | expgov + `.exports/cache/` | [`tooling/tooling.md`](./tooling/tooling.md) |
| **D.1** | W24 | Active vs commented dynamic counts | [`extractor/fusion.md`](./extractor/fusion.md) |
| **E.1–E.6** | W24 | Mixed-template extractor hardening | [`extractor/fusion.md`](./extractor/fusion.md) |
| **C.1** | W21 | Extractor bindings + prose filter | [`extractor/c1.md`](./extractor/c1.md) |
| **CI-1–5** | W23 | CI matrix, Turborepo scope | [`platform/ci.md`](./platform/ci.md) |
| **XP-0–7** | W23 | Cross-platform paths + home dir | [`platform/ci.md`](./platform/ci.md) |
| **T0–T10** | W23 | Tree/naming parity | [`platform/ci.md`](./platform/ci.md) |
| **6b / 6c / 7 / 8 / 9 / W** | W22 | Share + worker + web/report UX | [`share/share.md`](./share/share.md) |
| **H.1** | W20 | Translate L1/L2 cache | [`cache/cache.md`](./cache/cache.md) |
| **Session F** | W21 | Init + presets | [`cache/init.md`](./cache/init.md) |
| **Session H** | W21 | Locales multi-topology | [`cache/init.md`](./cache/init.md) |

---

## Receipt groups

| Group | Weeks / slices | Doc |
|-------|----------------|-----|
| Kits v1 | W28 | [`kits/kits.md`](./kits/kits.md) |
| Exports governance | W25–W28 | [`exports/governance.md`](./exports/governance.md) · [`tooling/tooling.md`](./tooling/tooling.md) · active [`exports/tiers.md`](./exports/tiers.md) · [`exports/program.md`](./exports/program.md) |
| Extractor & dynamic | W21 C.1, W24 E/D/T | [`extractor/c1.md`](./extractor/c1.md) · [`extractor/fusion.md`](./extractor/fusion.md) |
| Platform & release | W23 CI/XP/T/npm/git | [`platform/platform.md`](./platform/platform.md) · [`platform/ci.md`](./platform/ci.md) |
| Share & workers | W22 | [`share/share.md`](./share/share.md) |
| Engine & cache | W20–W21 | [`cache/generate.md`](./cache/generate.md) · [`cache/cache.md`](./cache/cache.md) · [`cache/init.md`](./cache/init.md) |
| Core & foundation | W15–W19 | [`core/core.md`](./core/core.md) |

---

## Maintainer workflow

1. Land the slice (tests + typecheck green).
2. Add a **row** under the ISO week in the grouped doc above.
3. Add a **`shipped[]` bullet** in [`phases.config.json`](../../apps/git/scripts/phases.config.json) for the same week.
4. Fold durable detail into [`systems/`](../systems/README.md) when behavior warrants a map.
