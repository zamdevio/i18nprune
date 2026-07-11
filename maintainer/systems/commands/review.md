# `review` — command system sheet

## Status

- **Stability:** stable
- **Last reviewed:** systems tree bootstrap

## Core / CLI entry

- **Core orchestration:** `packages/core/src/review/run.ts` → **`runReview(ctx, opts, host)`**
- **CLI envelope + `run.*` lifecycle:** `packages/cli/src/commands/review/jsonEnvelope.ts` → **`executeCore(ctx, opts)`** / **`runReviewJsonEnvelope(ctx, opts, runtime?)`**
- **CLI host hooks:** `packages/cli/src/commands/review/hooks.ts` → **`buildReviewHostHooks(ctx)`**
- **Human UI:** `packages/cli/src/commands/review/run.ts` → **`review()`**

## Core & shared

- Review collection / report in `packages/core/src/review/`.
- Core reads source/target locale JSON via adapters and returns `{ payload, issues }`.
- **Sentinel leak detect (read-only):** `scanLocaleForSentinelLeaks` → **`i18nprune.locale.placeholder_sentinel_leak`** (warn only; never writes).
- CLI owns envelope shaping and human output.

## Frozen API

- **`--json`** review payload (**`localeReview`** / per-locale shape); includes **`i18nprune.locale.placeholder_sentinel_leak`** when target leaves leak sentinels.
