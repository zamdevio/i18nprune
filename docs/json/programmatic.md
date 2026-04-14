# Programmatic API and the CLI JSON contract

**Normative CLI output:** [JSON output (`--json`)](./README.md) — envelope, supported commands, parsing rules, and `meta.apiVersion`.

## Who gets `run*`?

Every command in `COMMANDS_WITH_JSON_OUTPUT` (`packages/cli/src/constants/jsonoutput.ts`) has a **`run*`** helper that returns the same **`CliJsonEnvelope`** the CLI prints with global **`--json`**. **`generate`** and **`report`** are **async** (`Promise<…>`); the rest are synchronous unless noted in code.

## Headless entrypoints (flat or `programmatic` namespace)

| Export | Same as CLI |
|--------|-------------|
| **`tryResolveContext(cwd?)`** | Context resolution without throw; **`Result<'context', Context>`** |
| **`runValidate(ctx)`** | **`validate --json`** |
| **`runConfig(ctx)`** | **`config --json`** |
| **`runMissing(ctx, opts)`** | **`missing --json`** (payload before writes; throws on invalid paths like CLI) |
| **`runSync(ctx, opts)`** | **`sync --json`** (runs the same writes as CLI when not **`dryRun`**) |
| **`runCleanupCheck(ctx, opts)`** | **`cleanup --json`** / **`--check-only`** payload |
| **`runDoctor(ctx, opts)`** | **`doctor --json`** |
| **`runQuality(ctx, opts)`** | **`quality --json`** |
| **`runReview(ctx, opts)`** | **`review --json`** |
| **`runLanguages(ctx, opts)`** | **`languages --json`** |
| **`runGenerate(ctx, opts)`** | **`generate --json`** (async; writes locales unless **`dryRun`**) |
| **`runReport(opts)`** | **`report`** with global **`--json`** (async; **`opts.format`** selects file body; envelope includes full **`document`**) |

Helpers: **`collectDoctorFindings`**, **`doctorExitCode`**, **`DOCTOR_CHECK_IDS`**.

Serialize any envelope: **`stringifyEnvelope(envelope, pretty?)`** (also on **`result`** namespace).

Issue **`code`** strings: [issue codes](./issue-codes.md). Constants **`ISSUE_*`** are exported from **`core`**.

## Types and builders

`RESULT_API_VERSION`, `buildCliJsonEnvelope`, `stringifyCliCommandJson`, `Issue`, `CliJsonEnvelope`, `Result`, … — see [exports/core](../exports/core.md).

**Type locations (repo):** envelope and `Result` types — `packages/cli/src/types/core/json/envelope.ts` (also re-exported from `types/result/index.ts`). Command JSON payloads — e.g. `types/command/missing/json.ts`, `types/command/generate/json.ts`, `types/command/report/json.ts`, `types/command/review/json.ts`.

## Phase record

Maintainer checklist (completed): [phases/exports/README.md](../phases/exports/README.md).
