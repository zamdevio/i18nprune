# Extractor HOC §A — hooks + one-hop aliases

**Week:** 2026-W37 · **Tag:** lands after **1.0.3** (next patch / minor when released)

## Shipped

| Slice | What |
|-------|------|
| **Hook presets** | `useTranslation` / `useTranslations` → bind local `t` when hook is imported and configured (`t` and/or hook name in `functions`) |
| **One-hop aliases** | `const tt = t` / `const translate = i18n.t` expand effective helpers (single pass; no multi-hop / ternaries) |
| **Wiring** | `expandEffectiveFunctions` on keySites + dynamic orchestrators |

## Parked

- Renamed destructuring `const { t: translate }`
- Multi-hop · light-dataflow · HOC §B props (`extractor.hoc.enabled`)

## Code map

- `packages/core/src/extractor/bindings/hookPresets.ts`
- `packages/core/src/extractor/bindings/localHelpers.ts`
- `packages/core/src/extractor/bindings/expand.ts` (`expandEffectiveFunctions`)
