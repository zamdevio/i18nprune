# `generate` — command system sheet

## Status

- **Stability:** stable (large surface; refactors ongoing per **`MIGRATION.md`**)
- **Last reviewed:** systems tree bootstrap

## Operator surface

- **User docs:** `docs/commands/generate/README.md` (if present)

## CLI entry

- **`generate`:** `packages/cli/src/commands/generate/run.ts` (async). Thin entry shell —
  argv merge, **`resolveContext`**, branch on **`--json`** vs human, post-success
  patching / cache refresh.
- Hooks factory: `packages/cli/src/commands/generate/hooks.ts` —
  **`buildGenerateHostHooks(ctx, runtime)`** wires progress / TTY prompts
  into the **`GenerateHostHooks`** contract.
- Envelope shaping + shared core delegate:
  `packages/cli/src/commands/generate/jsonEnvelope.ts` — owns
  **`emptyGeneratePayload`**, **`executeCore`** (one place that calls **`runGenerate`**
  in core; reused by both **`--json`** and human paths), and
  **`runGenerateJsonEnvelope`** (success/failure envelope + **`run.*`** events; never
  throws). Mirrors the **`packages/cli/src/commands/<cmd>/jsonEnvelope.ts`** layout.

## Core & shared

- **`runGenerate`** in `packages/core/src/generate/run.ts` owns translation orchestration,
  provider fallback, identity guard, locale-leaf normalization, and file IO via
  **`RuntimeAdapters`**. The CLI is one host of many — SDK / extension / web / worker
  consumers call **`runGenerate`** directly with their own **`GenerateHostHooks`** (see
  `examples/sdk/generate/runGenerate.ts`). Mid-run decision points are exposed through
  the optional **`GenerateRunHooks`** (`onIncomplete`, `onHandoffPick`).
- Operation copy is emitted from core via **`run.message`**; CLI maps it to logger output.

## `run.*` events

- Heavy **`run.progress.generate`** usage — see [`../operations/flows-and-entrypoints.md`](../operations/flows-and-entrypoints.md) + `packages/core/src/types/shared/run/`.

## Frozen API

- **`--json`** generate payload (**`targetResults`**, provider meta, issues).
