# Preserve + sync alignment (v1.0.3)

**Week:** 2026-W37 · **Tag:** ships with **1.0.3**

## Shipped

| Slice | What |
|-------|------|
| **P0** | `copyPrefixes` / `uncertainPrefixes` / `copyKeys` → sync retain + hydrate (`expandSchemaPathsForPreserve`, `mergeSyncKeepPrefixes`) |
| **P2 JSON** | `data.scanExtrasRetained` + richer `scan_extras_retained` issues (`copyKey` / `copyPrefix` / `uncertainPrefix` / `autoUncertain`) |
| **P2 docs** | `docs/config/policies.md`, `docs/commands/sync.md`, `docs/issues/sync.md` — contract + migration off scan anchors |
| **Split semantics (doc)** | Verbatim = `copy*` · shape = `uncertainPrefixes` (no rename) |

## Parked

- Cross-file const-map → [`phases/extractor/cross-file.md`](../../phases/extractor/cross-file.md)
- Rename to `verbatimPrefixes` / `shapePrefixes` — not needed

## Code map

- `packages/core/src/policies/preserve.ts`
- `packages/core/src/sync/run.ts`
- `packages/core/src/sync/retainReasons.ts`
