# `fill` — command system sheet

## Status

- **Stability:** stable (refactors may continue per **`MIGRATION.md`**)
- **Last reviewed:** systems tree bootstrap

## CLI entry

- **`runFill`:** `packages/cli/src/commands/fill/runFill.ts` (async)
- **Locale work:** `packages/cli/src/commands/fill/fillLocale.ts` and related

## Core & shared

- Fill targets, translation, **`applyLocaleLeafNormalization`** where applicable (see imports).

## `run.*` events

- **`run.progress.fill`** — see [`../operations/flows-and-entrypoints.md`](../operations/flows-and-entrypoints.md) + run types.

## Frozen API

- **`--json`** fill envelope payload.
