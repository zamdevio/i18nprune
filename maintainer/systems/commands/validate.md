# `validate` — command system sheet

## Status

- **Stability:** stable
- **Last reviewed:** systems tree bootstrap

## Operator surface

- **User docs:** `docs/commands/validate/README.md` (if present; else `docs/commands` index)

## CLI entry

- **Envelope entry:** `packages/cli/src/commands/validate/jsonEnvelope.ts` → **`runValidate`**
- **Human command:** `packages/cli/src/commands/validate/run.ts`

## Core & shared

- **Payload / issues:** `@i18nprune/core` — `buildValidateIssues`, `buildValidateScanPayload`, extractor scan path; **`sentinelLeak`** target scan → **`i18nprune.locale.placeholder_sentinel_leak`** (warn only); see imports in `jsonEnvelope.ts`.

## Issue codes (sentinel repair v1.0.1)

| Code | When | Write? |
|------|------|--------|
| **`i18nprune.locale.placeholder_sentinel_leak`** | Target locale leaves contain stale **`__I18NPRUNE_*`** MT mask tokens | **No** — detect + suggest **`sync`** / **`generate`** |

User doc: `docs/issues/locale.md`. Shared module: `packages/core/src/shared/placeholders/sentinelLeak.ts`.

## Flow (short)

Discovery + scan input → core validate build → **`buildCliJsonEnvelope('validate', …)`**; emits **`run.*`** for progress/errors per **`RunEmitter`** contract (see [`../operations/entrypoints.md`](../operations/entrypoints.md) + run types).

## Frozen API

- **`--json`** validate payload shape, issue codes for source read failure, parity rules.
