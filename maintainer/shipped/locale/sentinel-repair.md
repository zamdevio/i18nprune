# Placeholder sentinel repair — shipped slices

**Phase:** [`placeholder-sentinel-repair.md`](../../phases/placeholder-sentinel-repair.md) · **Target release:** v1.0.1 (patch)

## Shipped

| Slice | Status | Receipt |
|-------|--------|---------|
| **PS-0** Shared module + read-only detect | **Shipped** | Core `sentinelLeak.ts`; `validate` / `quality` / `review` warn-only; issue `i18nprune.locale.placeholder_sentinel_leak`; `docs/issues/locale.md` |
| **PS-1** `sync` copy_source repair | **Shipped** | `runSync` post-merge repair; JSON `sentinelRepairs[]`; `docs/commands/sync.md` |

## Pending (v1.0.1)

| Slice | Notes |
|-------|--------|
| **PS-2** `generate` retranslate repair | Force leaked paths into translate queue; fail-closed on post-MT leak |
| **PS-2b** `generate --resume` pending | `isSentinelLeakPending` in resume set |
| **PS-5** Kits terminal MD dim | Separate kits output feat |
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
