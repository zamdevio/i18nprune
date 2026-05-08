# `missing` — command system sheet

## Status

- **Stability:** stable
- **Last reviewed:** systems tree bootstrap

## CLI entry

- **`runMissing`:** `packages/cli/src/commands/missing/jsonEnvelope.ts`
- **Human:** `packages/cli/src/commands/missing/run.ts`

## Core & shared

- Core missing / placeholder logic via `@i18nprune/core` (see `jsonEnvelope.ts` imports).

## Frozen API

- **`--json`** **`missing`** payload; interaction with **`--yes`** for writes.
