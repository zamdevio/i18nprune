# `missing` — command system sheet

## Status

- **Stability:** stable
- **Last reviewed:** systems tree bootstrap

## Core / CLI entry

- **Core orchestration:** `packages/core/src/missing/run.ts` → **`runMissing(ctx, opts, host)`**
- **CLI envelope + `run.*` lifecycle:** `packages/cli/src/commands/missing/jsonEnvelope.ts` → **`executeCore(ctx, opts)`** / **`runMissingJsonEnvelope(ctx, opts, runtime?)`**
- **CLI host hooks:** `packages/cli/src/commands/missing/hooks.ts` → **`buildMissingHostHooks(ctx)`**
- **Human UI:** `packages/cli/src/commands/missing/run.ts` → **`missing()`**

## Core & shared

- Core missing / placeholder logic via `@i18nprune/core`.
- Core reads source or existing target locale JSON via adapters and returns `{ payload, issues }` plus `targets[]` plan details.
- CLI owns confirmation prompts (one prompt per writable target) and calls core `writeMissingPaths` only after host policy allows mutation.
- `--target <code[,code]|all>` skips missing locale files with warnings instead of creating new locale JSON.

## Frozen API

- **`--json`** **`missing`** payload; interaction with **`--yes`** for writes.
