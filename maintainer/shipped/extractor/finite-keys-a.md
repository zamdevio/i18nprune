# Extractor finite-keys Track A — locale-assisted candidates

**Week:** 2026-W47 · **Tag:** **1.2.0** (next release cut with extractor close-out)

## Shipped

| Slice | What |
|-------|------|
| **Types** | Additive `candidateKeys` / `candidateKeysTruncated` on `DynamicKeySite`; `CandidateKey` with `confidence: 'locale_inferred' \| 'type_inferred'` |
| **Locale walk** | `collectLocaleInferredCandidates(prefix, leaves)` — leaves under prefix via `pathUnderUncertainPrefix`, sorted, capped at `FINITE_KEYS_LOCALE_CANDIDATE_CAP` (200) |
| **Enrichment** | `enrichDynamicSitesWithLocaleCandidates` on analysis full scan + src/locale incremental patches; idempotent strip-then-attach |
| **Display** | `locales dynamic` / validate detail lines show a short `locale candidates:` sample |
| **Safety** | Candidates never enter `provenKeys` / cleanup delete-safe sets |

`` t(`app.nav.${id}`) `` with source locale `{ app: { nav: { about, home } } }` keeps `app.nav` as an uncertain prefix and lists `app.nav.about` / `app.nav.home` as locale_inferred candidates. Prefix mismatch → empty candidates (no invented keys).

## Not in this slice

- **Track B** typed unions (`confidence: 'type_inferred'`) — waits on AST/`typed` ([`ast.md`](../../phases/extractor/ast.md)).
- New validate issue codes for “prefix has locale leaves” (optional warn) — deferred; data is on the site for hosts.
- Pattern-matching the static **suffix** after the first runtime hole (still lists all leaves under the prefix).

## Code map

- `packages/core/src/extractor/finiteKeys/` — collect + enrich
- `packages/core/src/shared/constants/extractor.ts` — cap
- `packages/core/src/types/extractor/finiteKeys/` · `dynamic/index.ts` — types
- `packages/core/src/analysis/{project,rebuild}.ts` — wire after `readSourceLocaleLeaves`
- `packages/core/src/extractor/dynamic/formatSiteDetail.ts` — human lines

## Tests

- `extractor/finiteKeys/__tests__/{localeCandidates,enrich}.test.ts`
- `analysis/__tests__/finiteKeysLocale.test.ts` — provenKeys unchanged; locale patch refreshes candidates
