# Extractor light-dataflow — same-file assignment chains

**Week:** 2026-W42 · **Tag:** lands after **1.1.1** (next minor when released)

## Shipped

| Slice | What |
|-------|------|
| **Assignment ledger** | Per-file `const` / `let` RHS ledger (`buildAssignmentLedger`) — one `O(lines)` pass; names reassigned anywhere in the file are dropped |
| **Multi-hop chains** | `const a = 'app.x'; const b = a; t(b)` now resolves to a `non_literal` hint `resolvedViaConstAssignment: 'app.x'` (cap = 2 identifier hops) |
| **Wiring** | `nonLiteralHintsForFirstArg` follows the ledger; the JS provider builds it **once per file** instead of rescanning source per call |

Hints only — `provenKeys` unchanged; `resolvedViaConstAssignment` / `branchLiterals` stay display-only. This is **key-value** chains (`const b = a` where `a` is a key string); multi-hop **helper** aliases (`const b = a` where `a` is a translation helper) stay one-hop in `bindings/localHelpers.ts` — inventory `extractor-reassignment-alias` remains open for those.

## Parked

- **Mixed-template folding (tier 2):** `const partial = \`${NS}.nav\`; t(\`${partial}.${page}\`)` still reports `staticPrefix: '${NS}.nav'` — recursive const resolution is the next slice (Phase 2 in [`light-dataflow.md`](../../phases/extractor/light-dataflow.md)).
- `t(cond ? 'a' : 'b')` branch enumeration beyond a local assignment.
- Cross-file `export const NS` → [`cross-file.md`](../../phases/extractor/cross-file.md).

## Code map

- `packages/core/src/extractor/constmap/assignments.ts` — `buildAssignmentLedger`
- `packages/core/src/extractor/constmap/build.ts` — `isReassignedInSource` now exported
- `packages/core/src/extractor/dynamic/hints.ts` — chain walk (`MAX_ASSIGNMENT_HOPS = 2`)
- `packages/core/src/extractor/dynamic/providers/javascript.ts` — ledger built once per file

## Tests

- `packages/core/src/extractor/dynamic/__tests__/hints.test.ts` — two-hop chain, template-terminated chain, chain cap, reassigned-name guard, ledger shape.
