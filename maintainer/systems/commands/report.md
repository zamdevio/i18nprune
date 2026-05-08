# `report` — command system sheet

## Status

- **Stability:** stable; Node / IO heavy (see **`MIGRATION.md`** / runtime docs)
- **Last reviewed:** systems tree bootstrap

## CLI entry

- **`runReport`:** `packages/cli/src/shared/report/runReport.ts` (async)
- **Envelope build:** `packages/cli/src/commands/report/buildEnvelope.ts` → **`runReportOperation`**

## Core & shared

- Project report schema, HTML/text generation — see `packages/core` report modules and report app as referenced from CLI.

## Frozen API

- **`--json`** report payload kind; **`--from`** validation for replay.
