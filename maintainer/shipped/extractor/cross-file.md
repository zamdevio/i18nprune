# Extractor cross-file — static string const imports

**Week:** 2026-W42 · **Tag:** lands after **1.1.1** (next minor when released)

## Shipped

| Slice | What |
|-------|------|
| **Export index** | `buildProjectExportConstIndex` — `absolutePath → { NAME: staticValue }` from `export const X = '…'`; templated values are skipped; `export { X } from './y'` re-exports are followed up to 2 hops |
| **Import resolution** | `import { NS } from './constants'` → relative-path resolution with extension and `index.*` candidates; `NS as NS2` aliases; type-only imports ignored; bare/aliased specifiers out of scope |
| **Per-file overlay** | `importedConstsForFile` → merged **under** the file's own const map (local shadowing wins), so a colliding `NS` in two files stays independent — no global merge |
| **Wiring** | `scanProjectSourceFiles` builds the index in pass 1 and hands each file an `importedConsts` overlay; the keySites and dynamic orchestrations merge it |

`` t(`${NS}.title`) `` with `import { NS } from './constants'` now folds like a same-file const — the site leaves the dynamic list and records `app.title` as a resolved observation. `provenKeys` gains keys that were previously `runtime_only`; parity snapshots do not move.

## Parked

- **Bare / `paths`-aliased specifiers** (tsconfig `paths`) — tier 2b.
- Cross-file **function** aliases (`export const t = …` in a wrapper package) — HOC + import bindings.
- Type-only exports (`export type NS = …`).
- **Perf:** the index is rebuilt per scan (keySites and dynamic each build one), so a pipeline builds it twice. Sharing one index across both scans is the next optimization; it is also a candidate row in [`bugs.md`](../../phases/bugs.md).

## Code map

- `packages/core/src/extractor/crossfile/index.ts` — index, specifier resolution, per-file overlay
- `packages/core/src/extractor/shared/projectScan.ts` — two-pass scan (index, then overlay)
- `packages/core/src/types/extractor/shared/index.ts` — `ScanProjectFileInput.importedConsts`
- `packages/core/src/extractor/keySites/orchestrate.ts` · `dynamic/orchestrate.ts` · `dynamic/providers/{index,javascript}.ts` — merge the overlay

## Tests

- `packages/core/src/extractor/crossfile/__tests__/index.test.ts` — index + re-export depth, extension-less and `index.*` resolution, aliased and type-only imports, and end-to-end dynamic + keySites folding including a **collision fixture**.
