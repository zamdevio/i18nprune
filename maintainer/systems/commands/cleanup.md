# `cleanup` — command system sheet

## Status

- **Stability:** stable
- **Last reviewed:** systems tree bootstrap

## CLI entry

- **`runCleanupCheck`:** `packages/cli/src/commands/cleanup/jsonEnvelope.ts`
- **Human:** `packages/cli/src/commands/cleanup/run.ts`

## Core & shared

- Cleanup candidates / apply in `@i18nprune/core` under `cleanup/` (see envelope imports).

## Frozen API

- **`--json`** cleanup payload; check-only vs apply flags.
