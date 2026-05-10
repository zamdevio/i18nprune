# Operations — flows and entrypoints (today)

**Event types:** `packages/core/src/types/shared/run/index.ts` (and related) — **canonical** payloads and discriminated **`run.*`** kinds.

**Planning / backlog:** sequencing and refactor targets → **`maintainer/phases/`** (e.g. **`core-architecture.md`**). Companion prose bucket (may consolidate here): [`maintainer/OPERATIONS.md`](../../OPERATIONS.md).

## Mental model

- **Core:** deterministic engines, no **`console.*`**, IO via adapters where applicable.
- **CLI / hosts:** resolve config, filesystem, **`RunEmitter`**, **`--json`** envelopes, exit codes, human UI.

## Emission (summary)

- Orchestration / host boundaries call **`emitRunEvent`** (core runtime helpers) with typed **`run.*`** payloads.
- Translators and other **pure helpers** **do not** emit **`run.*`** — emission stays at orchestration layers that own progress and lifecycle.
- **Doctor:** minimal **`run.*`** profile (typically **`run.started`** + **`run.completed`** only in its happy path — confirm in **`runDoctor`** and this folder’s command sheet).

If this summary diverges from code, **code + types win**; update **this doc** in the same PR.

## `runXxx` entry map (CLI today)

| Operation | Primary programmatic / envelope entry | Notes |
|-----------|--------------------------------------|--------|
| **sync** | `packages/cli/src/commands/sync/jsonEnvelope.ts` → **`runSync`** | Sync JSON = CLI envelope |
| **validate** | `packages/cli/src/shared/programmatic/runValidate.ts` → **`runValidate`** | |
| **doctor** | `packages/cli/src/commands/doctor/jsonEnvelope.ts` → **`runDoctor`** | |
| **missing** | `packages/cli/src/commands/missing/jsonEnvelope.ts` → **`runMissing`** | |
| **cleanup** | `packages/cli/src/commands/cleanup/jsonEnvelope.ts` → **`runCleanupCheck`** | |
| **quality** | `packages/cli/src/commands/quality/jsonEnvelope.ts` → **`runQuality`** | |
| **review** | `packages/cli/src/commands/review/jsonEnvelope.ts` → **`runReview`** | |
| **languages** | `packages/cli/src/commands/languages/jsonEnvelope.ts` → **`runLanguages`** | |
| **config** | `packages/cli/src/commands/config/jsonEnvelope.ts` → **`runConfig`** | |
| **providers** | `packages/cli/src/commands/providers/jsonEnvelope.ts` → **`runProviders`** | |
| **generate** | `packages/cli/src/commands/generate/run.ts` → **`generate`** (CLI shell) → core **`runGenerate`** | async, heavy **`run.progress.*`** |
| **fill** | `packages/cli/src/commands/fill/runFill.ts` → **`runFill`** | async |
| **report** | `packages/cli/src/shared/report/runReport.ts` → **`runReport`** · `commands/report/buildEnvelope.ts` → **`runReportOperation`** | async / IO |

**When this table drifts:** update it in the **same PR** that moves a **`runXxx`** or introduces a new envelope entry.

## Extraction target (backlog)

Remaining “runner in CLI” vs “engine in core” splits: **`maintainer/MIGRATION.md`**, **`maintainer/phases/core-architecture.md`**. This file describes **current** layout only.
