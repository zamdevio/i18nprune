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

- **`--json`** cleanup payload; check-only / dry-run vs apply flags.
- Apply writes only the configured **source locale**; run `sync` after cleanup to align targets.
