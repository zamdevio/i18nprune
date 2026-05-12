# Programmatic API and the CLI JSON contract

**Normative CLI output:** [JSON output (`--json`)](./README.md) — envelope, supported commands, parsing rules, and `meta.apiVersion`.

## Who gets `run*`?

Every command in `COMMANDS_WITH_JSON_OUTPUT` (`packages/cli/src/constants/jsonoutput.ts`) has a programmatic **`run*`** helper. Older helpers return the same **`CliJsonEnvelope`** the CLI prints with global **`--json`**. Migrated core ops (for example **`generate`** and **`sync`**) return `{ payload, issues }`; the CLI envelope wrapper stays host-owned.

## Headless entrypoints (flat or `programmatic` namespace)

| Export | Same as CLI |
|--------|-------------|
| **`tryResolveContext(cwd?)`** | Context resolution without throw; **`Result<'context', Context>`** |
| **`runValidate(ctx)`** | **`validate --json`** |
| **`runConfig(ctx)`** | **`config --json`** |
| **`runMissing(ctx, opts, host)`** | Core **`missing`** planner (payload before writes; CLI wraps returned `{ payload, issues }` in the stable JSON envelope) |
| **`runSync(ctx, opts, host)`** | Core **`sync`** engine (runs the same writes as CLI when not **`dryRun`**; CLI wraps returned `{ payload, issues }` in the stable JSON envelope) |
| **`runCleanup(ctx, opts, host)`** | Core **`cleanup`** planner (payload + source-only `writePlan`; CLI wraps it in the stable JSON envelope) |
| **`runDoctor(ctx, opts)`** | **`doctor --json`** |
| **`runQuality(ctx, opts, host)`** | Core **`quality`** checker (CLI wraps returned `{ payload, issues }` in the stable JSON envelope) |
| **`runReview(ctx, opts, host)`** | Core **`review`** aggregator (CLI wraps returned `{ payload, issues }` in the stable JSON envelope) |
| **`runLanguages(ctx, opts)`** | **`languages --json`** |
| **`runGenerate(ctx, opts)`** | **`generate --json`** (async; writes locales unless **`dryRun`**). Pass **`opts.resume`** + **`opts.resumeReference`** for **`generate --resume`** (not config). |
| **`runReport(opts)`** | **`report`** with global **`--json`** (async; **`opts.format`** selects file body; envelope includes full **`document`**) |

Helpers: **`collectDoctorFindings`**, **`doctorExitCode`**, **`DOCTOR_CHECK_IDS`**.

Serialize any envelope: **`stringifyEnvelope(envelope, pretty?)`** (also on **`result`** namespace).

Issue **`code`** strings: [issue codes](../issues/README.md). Constants **`ISSUE_*`** are exported from **`core`**.

## Types and builders

`RESULT_API_VERSION`, `buildCliJsonEnvelope`, `stringifyCliCommandJson`, `Issue`, `CliJsonEnvelope`, `Result`, … — see [exports/core](../exports/core.md).

**Type locations (repo):** envelope and `Result` types live in **`@i18nprune/core`**. Migrated core payload types live there too (for example `GenerateJsonPayload`, `SyncJsonOutput`, `MissingJsonOutput`, `CleanupJsonOutput`, `QualityJsonData`, `ReviewJsonData`).

## Phase record

Surface parity references: [`docs/exports/README.md`](../exports/README.md).
