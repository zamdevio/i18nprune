# Command orchestration boundary

This note defines how CLI command modules should be structured.

## Principle

- Command handlers orchestrate.
- Core modules implement behavior.

## Command layer responsibilities

- read flags/options
- resolve runtime context
- prompt users when needed (TTY flow)
- call core functions
- print summaries / write report entries

## File layout inside a command package

Prefer **`commands/<name>/index.ts`** as a **re-export barrel** and **`run.ts`** as the main handler, with additional same-folder modules only for orchestration splits (summaries, option wiring). This keeps entry points obvious and aligns with planned package exports (a stable `run*` hook vs optional deep imports of helpers).

| File / role | Responsibility |
|-------------|----------------|
| **`index.ts`** | Re-exports only, e.g. `export { runFoo } from './run.js'`. |
| **`run.ts`** | **Exported handler first** (after imports), private helpers after. Primary function: **same name as the CLI subcommand** (`sync()`, `generate()`, `doctor()`, …). Exception: **`help/run.ts`** exports **`configureCliHelp`** / **`colorizeHelpText`** (no `help()` runner). Not `fooCmd()` (redundant inside `commands/foo/`). |
| **Other `*.ts`** | Optional splits (`targets.ts`, `summary.ts`, …) — orchestration and CLI presentation only. |

Rollout is incremental (when touching a command or a dedicated pass).

## Core layer responsibilities

- deterministic domain behavior
- reusable logic for CLI + programmatic API
- typed data shapes and transforms

## Why this helps exports

When logic lives in `core/`, namespace-based API exports become clean and predictable (`core/extractor`, `core/validate`, etc.), and integrations avoid depending on command wiring internals.

## See also

- [ADR 006 — Command orchestrator boundary](../../architecture/decisions/006-command-orchestrator-boundary.md)
- [Commands hub](..)
- [`docs/exports/`](../../exports)
- [CLI prompt modules](../../cli/prompts)
