# `generate` — command system sheet

## Status

- **Stability:** stable (large surface; refactors ongoing per **`MIGRATION.md`**)
- **Last reviewed:** systems tree bootstrap

## Operator surface

- **User docs:** `docs/commands/generate/README.md` (if present)

## CLI entry

- **`generate`:** `packages/cli/src/commands/generate/run.ts` (async). Single-file shell —
  argv merge, source read, target prompt, **`CoreContext`** + **`GenerateHostHooks`** build,
  delegates to **`runGenerate`** in core, renders JSON envelope or human summary.

## Core & shared

- **`runGenerate`** in `packages/core/src/generate/run.ts` owns translation orchestration,
  provider fallback, identity guard, locale-leaf normalization, and file IO via
  **`RuntimeAdapters`**. SDK consumers can call it directly with their own
  **`GenerateHostHooks`** (see `examples/sdk/generate/`).

## `run.*` events

- Heavy **`run.progress.generate`** usage — see [`../operations/flows-and-entrypoints.md`](../operations/flows-and-entrypoints.md) + `packages/core/src/types/shared/run/`.

## Frozen API

- **`--json`** generate payload (**`targetResults`**, provider meta, issues).
