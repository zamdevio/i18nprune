# `generate` — command system sheet

## Status

- **Stability:** stable (large surface; refactors ongoing per **`MIGRATION.md`**)
- **Last reviewed:** systems tree bootstrap

## Operator surface

- **User docs:** `docs/commands/generate/README.md` (if present)

## CLI entry

- **`runGenerate`:** `packages/cli/src/commands/generate/runGenerate.ts` (async)
- **Execution body:** `packages/cli/src/commands/generate/execute.ts` → **`executeGenerate`**

## Core & shared

- Translation pipeline, **`translateLeaf`**, provider resolution, **`applyLocaleLeafNormalization`** after target writes (see `execute.ts`).

## `run.*` events

- Heavy **`run.progress.generate`** usage — see [`../operations/flows-and-entrypoints.md`](../operations/flows-and-entrypoints.md) + `packages/core/src/types/shared/run/`.

## Frozen API

- **`--json`** generate payload (**`targetResults`**, provider meta, issues).
