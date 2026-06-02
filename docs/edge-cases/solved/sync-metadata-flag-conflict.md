# Sync metadata flag conflict

## Problem

Operators sometimes pass **`sync --metadata`** and **`sync --strip-metadata`** in the same invocation (copy-pasted CI flags, or “try both” locally). Without an explicit rule, it would be unclear whether structured leaves are promoted or stripped.

## What we do

1. **Precedence:** `--strip-metadata` wins — leaves are written as plain strings (`legacy_string` mode for that run).
2. **Signal:** emit **`i18nprune.sync.metadata_flag_conflict`** (`warning`) on the CLI envelope and in human output so automation can detect ambiguous intent.
3. **No hard failure:** the run continues; fix flags or monitor the warning in CI.

## Operator checklist

| Goal | Flags |
|------|--------|
| Promote/repair structured leaves | `sync --metadata` (and configured `localeLeaves.mode` if needed) |
| Roll back to plain strings | `sync --strip-metadata` only |
| CI strictness | `jq` on `.issues[] | select(.code == "i18nprune.sync.metadata_flag_conflict")'` |

## See also

- [sync command](../../commands/sync.md#metadata-flag-conflict)
- [Locales config — leaf metadata mode](../../config/locales.md#leaf-metadata-mode)
- [sync issues — metadata_flag_conflict](../../issues/sync.md#metadata_flag_conflict)
- [ADR 010 — Locale layout and metadata modes](../../architecture/decisions/010-locale-layout-and-metadata-modes.md)
