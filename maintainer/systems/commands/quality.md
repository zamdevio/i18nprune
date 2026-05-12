# `quality` — command system sheet

## Status

- **Stability:** stable
- **Last reviewed:** systems tree bootstrap

## Core / CLI entry

- **Core orchestration:** `packages/core/src/quality/run.ts` → **`runQuality(ctx, opts, host)`**
- **CLI envelope + `run.*` lifecycle:** `packages/cli/src/commands/quality/jsonEnvelope.ts` → **`executeCore(ctx, opts)`** / **`runQualityJsonEnvelope(ctx, opts, runtime?)`**
- **CLI host hooks:** `packages/cli/src/commands/quality/hooks.ts` → **`buildQualityHostHooks(ctx)`**
- **Human UI:** `packages/cli/src/commands/quality/run.ts` → **`quality()`**

## Core & shared

- Quality / parity checks — `packages/core/src/quality/`.
- Core reads source/target locale JSON via adapters and returns `{ payload, issues }`, including locale file rows used by the human summary.
- CLI owns envelope shaping and human output.

## Frozen API

- **`--json`** quality payload; stable issue codes (**e.g.** `english_identical_leaves`).
