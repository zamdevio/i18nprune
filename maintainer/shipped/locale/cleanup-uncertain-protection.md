# Cleanup uncertain-prefix protection + kits source resolution (v1.1.1)

**Week:** 2026-W42 · **Tag:** ships with **1.1.1**

Three defects found in one consumer session (locale_directory + `locale_per_dir`, `en` source, `so` target). They were layout-adjacent but independent. All three are covered by regression tests that fail against the pre-fix code.

## Shipped

| Slice | What |
|-------|------|
| **BUG-002** | `cleanup --target <locale>` now routes through `computeCleanupCandidateKeys`, same as source mode — the silent loss of scan-derived uncertain-prefix protection is gone |
| **BUG-002 (signal)** | `excludedUncertain` is emitted in **both** modes, and `data.uncertainPrefixes` is populated in target mode (was hardcoded `[]`) |
| **BUG-001** | Declared `policies.preserve.uncertainPrefixes` reaches the reference context via `collectDeclaredUncertainPrefixes`, so the documented knob actually protects `cleanup` |
| **BUG-003** | Review payload `sourceLocale` reports the **locale code** under segmented layouts; `kits identical` resolves source leaves through `segmentsForLocaleCode` instead of joining `${code}.json` |

## Root causes

- **BUG-002** — target mode had its own candidate path (`computeExtraTargetKeys`) that never consulted the uncertain list, and `uncertainPrefixes: isTargetMode ? [] : refCtx.uncertainPrefixes` baked the omission into the payload. `copyPrefixes` protected target mode only because `computeExtraTargetKeys` honours `isPreservePath`; scan-derived uncertainty did not.
- **BUG-001** — `buildKeyReferenceContextFromLiteralUsageAndDynamicSites` took the effective **reference** config, never the **preserve** policy, so declared `uncertainPrefixes` reached `sync` but not `cleanup`.
- **BUG-003** — `basenameNoExt(sourceLocalePath)` is only correct for `locale_file` (`locales/en.json` → `en`); under `locale_per_dir` it yields the segment (`locales/en/about.json` → `about`). `kits identical` had the mirror-image bug: it joined `localesDir` + `${code}.json`, producing `locales/en.json` → `ENOENT`.

## Code map

- `packages/core/src/cleanup/run.ts` — unified candidate generation; both modes through `computeCleanupCandidateKeys`
- `packages/core/src/policies/preserve.ts` — `collectDeclaredUncertainPrefixes`
- `packages/core/src/shared/reference/context.ts` — `preserve?: PreservePolicy` on all three builders
- `packages/core/src/review/report.ts` — layout-aware `sourceLocale`
- `packages/cli/src/commands/kits/identical.ts` — source segments via `segmentsForLocaleCode`
- Threading sites: `suggestions/computeUnusedSourceKeys.ts`, `sync/run.ts`, `cli/shared/reference/context.ts`, `cli/commands/generate/jsonEnvelope.ts`

## Tests

- `packages/core/src/cleanup/__tests__/uncertainProtection.test.ts` — source **and** target mode protection, declared + scan-derived prefixes
- `packages/core/src/review/__tests__/report.test.ts` — `sourceLocale` is the code, not the segment stem, under `locale_per_dir`
- `tests/integration/layout.fixtures.test.ts` — `kits identical` across `locale_per_dir` and `flat_file`

## Docs

- `docs/commands/cleanup.md` — the vs-`sync` table no longer claims target mode skips the uncertain guard; protection parity is stated explicitly

## Non-goal (kept)

`uncertainPrefixes` stays **shape** (translatable), `copyPrefixes` stays **verbatim** (skip MT). No rename; the split is now honest instead of one knob silently not working.
