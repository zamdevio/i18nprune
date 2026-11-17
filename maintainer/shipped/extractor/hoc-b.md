# Extractor HOC §B — opt-in prop helpers

**Week:** 2026-W47 · **Tag:** **1.2.0**

## Shipped

| Slice | What |
|-------|------|
| **Config** | `extractor.hoc.enabled` (default **false**) + optional `propNames` (default `['t']`) |
| **Prop scan** | `function Row({ t })` / `const Row = ({ t }) =>` first-param destructuring → promote matching names into effective helpers |
| **Wiring** | `expandEffectiveFunctions(…, hoc)` on keySites + dynamic orchestrators; analysis passes `ctx.config.extractor?.hoc` |
| **Init template** | Commented example in the rich init config |

Off by default — unrelated props named `t` are a false-positive risk. Renames (`{ t: translate }`) and JSX `<Row t={t} />` tracing are **not** in this slice.

## Parked

- **Tier 3** JSX / cross-component prop trace
- Renamed destructuring `{ t: translate }`
- Multi-hop prop aliases

## Code map

- `packages/core/src/extractor/bindings/propHelpers.ts`
- `packages/core/src/extractor/bindings/localHelpers.ts` · `expand.ts`
- `packages/core/src/config/schema/root.ts` (`extractor.hoc`)
- `packages/core/src/types/extractor/hoc/`
- `packages/core/src/analysis/{project,rebuild}.ts`

## Tests

- `extractor/bindings/__tests__/propHelpers.test.ts`
