# Extractor light-dataflow — same-file chains + mixed-template folding

**Week:** 2026-W42 · **Tag:** lands after **1.1.1** (next minor when released)

## Shipped

| Slice | What |
|-------|------|
| **Assignment ledger** | Per-file `const` / `let` RHS ledger (`buildAssignmentLedger`) — one `O(lines)` pass; names reassigned anywhere in the file are dropped |
| **Multi-hop chains** | `const a = 'app.x'; const b = a; t(b)` now resolves to a `non_literal` hint `resolvedViaConstAssignment: 'app.x'` (cap = 2 identifier hops) |
| **Mixed-template folding** | `tryResolveTemplatePrefixBeforeUnknown` recurses into substituted const values, so `const partial = \`${NS}.nav\`; t(\`${partial}.${page}\`)` reports `staticPrefix: 'app.nav'` (was `'${NS}.nav'`); cuts cleanly at an unknown identifier inside a substituted value |
| **Wiring** | `nonLiteralHintsForFirstArg` follows the ledger; the JS provider builds it **once per file** instead of rescanning source per call |

`provenKeys` is unchanged and parity snapshots do not move. Hints (`resolvedViaConstAssignment` / `branchLiterals`) stay display-only; folding only sharpens `staticPrefix`, which feeds uncertain-prefix protection and candidate keys.

## Parked

- **Helper multi-hop aliases** (`const b = a` where `a` is a translation helper) — `bindings/localHelpers.ts` stays one-hop; inventory `extractor-reassignment-alias`.
- `t(cond ? 'a' : 'b')` branch enumeration beyond a local assignment.
- Cross-file `export const NS` → [`cross-file.md`](./cross-file.md) (receipt).

## Code map

- `packages/core/src/extractor/constmap/assignments.ts` — `buildAssignmentLedger`
- `packages/core/src/extractor/constmap/build.ts` — `isReassignedInSource` now exported
- `packages/core/src/extractor/dynamic/hints.ts` — chain walk (`MAX_ASSIGNMENT_HOPS = 2`)
- `packages/core/src/extractor/dynamic/rebuild.ts` — recursive prefix folding
- `packages/core/src/extractor/dynamic/providers/javascript.ts` — ledger built once per file

## Tests

- `packages/core/src/extractor/dynamic/__tests__/hints.test.ts` — two-hop chain, template-terminated chain, chain cap, reassigned-name guard, ledger shape.
- `packages/core/src/extractor/dynamic/__tests__/rebuild.test.ts` — recursive folding (one and two levels), unknown-inner cut, and the end-to-end `staticPrefix` via the provider.
