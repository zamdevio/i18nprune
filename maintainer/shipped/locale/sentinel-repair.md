# Placeholder sentinel repair — shipped slices

**Target release:** v1.0.1 (patch) · **Engineering maps:** [`systems/commands/`](../systems/commands/) (`validate`, `sync`, `generate`, `quality`, `review`)

## Shipped

| Slice | Status | Receipt |
|-------|--------|---------|
| **PS-0** Shared module + read-only detect | **Shipped** | Core `sentinelLeak.ts`; `validate` / `quality` / `review` warn-only; issue `i18nprune.locale.placeholder_sentinel_leak`; `docs/issues/locale.md` |
| **PS-1** `sync` copy_source repair | **Shipped** | `runSync` post-merge repair; JSON `sentinelRepairs[]`; bounded detail list via `--top` / `--full`; `docs/commands/sync.md` |
| **PS-2** `generate` retranslate repair | **Shipped** | Force queue + `placeholder_copy`/MT; JSON `sentinelRepairs[]`; resume via `localePathLooksTranslatedFromSource` |
| **PS-2b** `generate --resume` pending | **Shipped** | Leaked leaves not treated as translated (`isSentinelLeakPending`) |
| **PS-5** Kits terminal MD dim | **Shipped** | `formatKitsTerminalMarkdown`; dual `markdownText` / `terminalText`; `docs/commands/kits/README.md` |
| **CLI `--no-repair-sentinel-leaks`** | **Shipped** | `generate` + `sync` argv |

## Pending (v1.0.1 release admin)

| Slice | Notes |
|-------|--------|
| **PS-3** Release publish | Tag `v1.0.1`, npm publish — releases YAML added |

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

## Operator playbook

```bash
i18nprune validate                              # detect (warn only)
i18nprune sync --metadata --target ar           # copy source at leaked paths
i18nprune generate --metadata --target ar       # re-translate leaked paths
i18nprune generate --resume --metadata --target ar
```

Prefer Google / DeepL over weak MT backends for heavy `{{…}}` format strings.
