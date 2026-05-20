# Operations — entrypoints (today)

**Event types:** `packages/core/src/types/shared/run/index.ts` (and related) — **canonical** payloads and discriminated **`run.*`** kinds.

**Planning / backlog:** sequencing and refactor targets → **`maintainer/phases/`**.

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
| **sync** | core entry: `packages/core/src/sync/run.ts` → **`runSync`**. CLI host: `packages/cli/src/commands/sync/hooks.ts`; envelope/lifecycle wrapper: `packages/cli/src/commands/sync/jsonEnvelope.ts` → **`executeCore`** / **`runSyncJsonEnvelope`** | Sync JSON = CLI envelope |
| **validate** | `packages/cli/src/commands/validate/jsonEnvelope.ts` → **`runValidate`** | CLI-hosted envelope; core owns validate payload/issue builders |
| **doctor** | `packages/cli/src/commands/doctor/jsonEnvelope.ts` → **`runDoctor`** | |
| **missing** | core entry: `packages/core/src/missing/run.ts` → **`runMissing`**. CLI host: `packages/cli/src/commands/missing/hooks.ts`; envelope/lifecycle wrapper: `packages/cli/src/commands/missing/jsonEnvelope.ts` → **`executeCore`** / **`runMissingJsonEnvelope`** | |
| **cleanup** | core entry: `packages/core/src/cleanup/run.ts` → **`runCleanup`**. CLI host: `packages/cli/src/commands/cleanup/hooks.ts`; envelope/lifecycle wrapper: `packages/cli/src/commands/cleanup/jsonEnvelope.ts` → **`executeCore`** / **`runCleanupJsonEnvelope`** | Source-locale-only write plan; CLI handles prompts and applies the core write plan |
| **quality** | core entry: `packages/core/src/quality/run.ts` → **`runQuality`**. CLI host: `packages/cli/src/commands/quality/hooks.ts`; envelope/lifecycle wrapper: `packages/cli/src/commands/quality/jsonEnvelope.ts` → **`executeCore`** / **`runQualityJsonEnvelope`** | |
| **review** | core entry: `packages/core/src/review/run.ts` → **`runReview`**. CLI host: `packages/cli/src/commands/review/hooks.ts`; envelope/lifecycle wrapper: `packages/cli/src/commands/review/jsonEnvelope.ts` → **`executeCore`** / **`runReviewJsonEnvelope`** | |
| **languages** | `packages/cli/src/commands/languages/jsonEnvelope.ts` → **`runLanguages`** | |
| **config** | `packages/cli/src/commands/config/jsonEnvelope.ts` → **`runConfig`** | |
| **providers** | `packages/cli/src/commands/providers/jsonEnvelope.ts` → **`runProviders`** | |
| **generate** | core entry: `packages/core/src/generate/run.ts` → **`runGenerate`**. CLI host: `packages/cli/src/commands/generate/run.ts` (shell) + `hooks.ts` (host hooks) + `jsonEnvelope.ts` (envelope + shared core delegate). Other hosts (SDK, extension, web, workers) call core **`runGenerate`** directly | async, heavy **`run.progress.*`** (**`--resume`** shares this path) |
| **report** | `packages/cli/src/shared/report/runReport.ts` → **`runReport`** · `commands/report/buildEnvelope.ts` → **`runReportOperation`** | async / IO |
| **share** | core: `packages/core/src/share/ops/run.ts` → **`runShare`** · `ops/list.ts` / `ops/view.ts` / `ops/delete.ts` · `payload/*` · `policy/policy.ts` · `cache/io/shareJson.ts` · `cache/shareJsonBackup.ts` · `emit/human.ts` · `remote/remote.ts` · `run.share.*` events. CLI: `packages/cli/src/commands/share/` (`upload`, `list`, `view`, `delete`, `cacheDebug.ts`, `workerHttp.ts`). Worker: `apps/workers/i18nprune/src/routes/v1/`. Types: `packages/core/src/types/share/*` | `share.bak/` backups; `--debug-cache` `[cache]` lines; `share upload` subcommand; `delete --all` |

**When this table drifts:** update it in the **same PR** that moves a **`runXxx`** or introduces a new envelope entry.

## Note

Core-op migration is **shipped** — all ops have core `runXxx` entries. This file describes **current** layout only.
