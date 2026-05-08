# `validate` — command system sheet

## Status

- **Stability:** stable
- **Last reviewed:** systems tree bootstrap

## Operator surface

- **User docs:** `docs/commands/validate/README.md` (if present; else `docs/commands` index)

## CLI entry

- **`runValidate`:** `packages/cli/src/shared/programmatic/runValidate.ts`
- **Human command:** `packages/cli/src/commands/validate/run.ts` (if separate)

## Core & shared

- **Payload / issues:** `@i18nprune/core` — `buildValidateIssues`, `buildValidateScanPayload`, extractor scan path; see imports in `runValidate.ts`.

## Flow (short)

Discovery + scan input → core validate build → **`buildCliJsonEnvelope('validate', …)`**; emits **`run.*`** for progress/errors per **`RunEmitter`** contract (see [`../operations/flows-and-entrypoints.md`](../operations/flows-and-entrypoints.md) + run types).

## Frozen API

- **`--json`** validate payload shape, issue codes for source read failure, parity rules.
