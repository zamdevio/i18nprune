# `cleanup` — command system sheet

## Status

- **Stability:** stable
- **Last reviewed:** systems tree bootstrap

## CLI entry

- **Core:** `packages/core/src/cleanup/run.ts` → **`runCleanup`**
- **Host hooks:** `packages/cli/src/commands/cleanup/hooks.ts`
- **Envelope:** `packages/cli/src/commands/cleanup/jsonEnvelope.ts` → **`executeCore`** / **`runCleanupJsonEnvelope`**
- **Human:** `packages/cli/src/commands/cleanup/run.ts`

## Core & shared

- Cleanup candidates, string-presence policy, source-only write planning, and operation messages live in `@i18nprune/core` under `cleanup/`.

## Frozen API

- **`--json`** cleanup payload; `--dry-run` for preview; global **`--yes`** / **`--ask`** for writes (no `--apply` flag).
- **`--target <code[,code]|all>`** prunes extra keys from one or more target locales (per-locale scan/`(code)` logs and confirms); default (no `--target`) prunes the **source** locale. Sync-after hint (`notice`) only on source writes.
- Global **`--top`** / **`--full`** cap string-presence skip lines (verbose detail channel).
- **`--rg`** opt-in ripgrep string-presence guard; default is static scan only (no `--no-rg`).
- Run `sync` after source cleanup to align targets when needed.
