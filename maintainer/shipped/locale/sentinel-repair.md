# Placeholder sentinel repair — shipped slices

**Phase:** [`placeholder-sentinel-repair.md`](../../phases/placeholder-sentinel-repair.md) · **Target release:** v1.0.1 (patch)

## Shipped

| Slice | Status | Receipt |
|-------|--------|---------|
| **PS-0** Shared module + read-only detect | **Shipped** | Core `sentinelLeak.ts`; `validate` / `quality` / `review` warn-only; issue `i18nprune.locale.placeholder_sentinel_leak`; `docs/issues/locale.md` |
| **PS-1** `sync` copy_source repair | **Shipped** | `runSync` post-merge repair; JSON `sentinelRepairs[]`; `docs/commands/sync.md` |
| **PS-2** `generate` retranslate repair | **Shipped** | Force queue + `placeholder_copy`/MT; JSON `sentinelRepairs[]`; resume via `localePathLooksTranslatedFromSource` |
| **PS-2b** `generate --resume` pending | **Shipped** | Leaked leaves not treated as translated (`isSentinelLeakPending`) |

## Pending (v1.0.1)

| Slice | Notes |
|-------|--------|
| **PS-5** Kits terminal MD dim | Separate kits output feat |
| **CLI `--no-repair-sentinel-leaks`** | **Shipped** | `generate` + `sync` argv |
| **PS-3** Release bump | 1.0.1 + changelog when ready to publish |

## Core module

**Path:** `packages/core/src/shared/placeholders/sentinelLeak.ts`

| API | PS-0 | PS-1 | PS-2 |
|-----|------|------|------|
| `scanLocaleForSentinelLeaks` | detect | detect | detect |
| `repairSentinelLeaksCopyFromSource` | — | sync write | — |
| `planSentinelLeakGenerateRepairs` | — | — | generate |
| `isSentinelLeakPending` | — | — | resume |

## Issue code

- **`i18nprune.locale.placeholder_sentinel_leak`** — read-only ops (`validate`, `quality`, `review`); user doc: `docs/issues/locale.md`
- Related write-path: **`placeholder_sentinel_mangled`** in `docs/issues/translate.md` (generate MT fail-closed)
