# Deep-merge loaders + nested feature_bundle paths

**Week:** 2026-W47 · **Tag:** lands after **1.1.1** (next patch/minor)

Two defects from the CepatEdge layout migration discussion. Both are covered by regression tests that failed against the pre-fix code.

## Shipped

| Slice | What |
|-------|------|
| **BUG-004** | Generated multi-segment loaders deep-merge segment JSON instead of `Object.assign` — overlapping object layers across files keep all leaves |
| **BUG-005** | `feature_bundle` loader basenames use the full path before the locale file (`maintenance/details`), matching structural slots / sync write plans; nested feature dirs work up to walk depth 16 |

## Root causes

- **BUG-004** — `renderLoaderEntry` used `Object.assign({}, ...mods)`, which replaces entire top-level keys when two segments share a parent object (e.g. both export `pages`).
- **BUG-005** — `featureBasenamesFromRelativePaths` used `indexOf('/')` (first segment only) while `localeStructuralSlot` / `swapLocaleInSegmentRelativePath` already used `lastIndexOf('/')`. Read/sync/parity were fine; the generated import list was wrong.

## Code map

- `packages/core/src/patching/deepMergeLocaleMessages.ts` — helper + inlined source for generated loaders
- `packages/core/src/patching/generatedModule.ts` — deep-merge reduce in multi-segment loaders
- `packages/core/src/patching/localeDiscovery.ts` — nested feature basenames
- `docs/config/locales.md` — nested segments + deep-merge contract

## Tests

- `packages/core/src/patching/__tests__/deepMergeLocaleMessages.test.ts`
- `packages/core/src/patching/__tests__/localeDiscovery.test.ts` — BUG-004 / BUG-005 cases
- `packages/core/src/shared/locales/enumerate/__tests__/enumerate.test.ts` — nested feature discovery
- `packages/core/src/shared/locales/targets/__tests__/segmentWritePlan.test.ts` — nested locale swap
- `packages/core/src/shared/locales/diagnostics/__tests__/structuralParity.test.ts` — nested structural slot

## Intentional non-goals

- No warn/fail on overlapping top-level keys — deep merge is the supported split strategy.
- Leaf path collisions across two files: later segment wins at that leaf (same as pre-fix assign semantics, but nested siblings survive).
