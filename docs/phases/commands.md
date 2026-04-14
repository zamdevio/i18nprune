# Phase — Command Orchestrator Boundary

**Status:** completed (guardrail satisfied; proceed to [exports](./exports/README.md)).

This phase defines and enforces one strict architectural rule:

- **Commands are orchestrators only.**
- **Business logic lives in `core/`** (and shared helpers in `utils/` where appropriate).

## Why this exists

Before exports namespace work, command boundaries must be clear. If command files hold logic, public API grouping becomes inconsistent and hard to integrate.

## Rule (locked)

1. `packages/cli/src/commands/*` may:
   - parse/normalize options
   - call core functions
   - handle prompts/TTY flow
   - handle output/report orchestration
2. `packages/cli/src/commands/*` should **not** contain reusable business logic.
3. Reusable behavior must move to:
   - `packages/cli/src/core/**` (domain logic), or
   - `packages/cli/src/utils/**` (shared utilities)

## Documentation touchpoints

- ADR: `docs/architecture/decisions/006-command-orchestrator-boundary.md`
- Architecture note: `docs/commands/orchestration/README.md`
- Command docs index note: `docs/commands/README.md`

## Command package layout

Same content is summarized for the docs site under [Command orchestration boundary — file layout](../commands/orchestration/README.md#file-layout-inside-a-command-package).

Large commands under `packages/cli/src/commands/<name>/` should be **split into small files** in that folder, not one giant `index.ts`.

| File / role | Responsibility |
|-------------|----------------|
| **`index.ts`** | **Re-exports only** — e.g. `export { sync } from './run.js'`. No orchestration body. Call sites (argv, bin) keep importing `@/commands/foo` unchanged. |
| **`run.ts`** | **Primary exported handler first** (after imports), helpers below. Main function named like the **subcommand**: **`sync(opts)`**, **`generate(opts)`**, **`missing(opts)`**, etc. (not `syncCmd()` — redundant). Exception: **`help`** uses **`configureCliHelp`** / **`colorizeHelpText`**. |
| **Split modules** | Optional co-located files with **clear names**: `targets.ts`, `resolve.ts`, `summary.ts`, `json.ts`, `prompts.ts`, etc. — **orchestration and presentation only**; domain rules stay in `core/`. |

**Why:** readability, reviewable diffs, and a stable surface for the **exports** phase: a thin `index.ts` makes it obvious what is “the command’s public hook” vs internal helpers, and avoids mixing two consumption stories (deep imports vs package entry) in one file.

**Rollout:** apply when touching a command for other reasons, or in a dedicated pass; no need to block other work on an all-at-once rename.

## Execution checklist

- [x] Audit command modules for embedded business logic (ongoing; see extractions below).
- [x] Extract reusable logic into `core/` + tests (first wave: `missing`, `fill`, `sync` apply, locales listing, etc.).
- [x] Keep command modules focused on orchestration/prompt/output (ongoing polish; deep domain cuts optional per command).
- [x] Split command entrypoints per [Command package layout](#command-package-layout) (`index.ts` re-export + `run.ts`; further helper splits optional).
- [x] Unify command entry naming (`sync()`, `doctor()`, …; **`help`** exception documented).
- [x] `run.ts` structure: **main handler first**, helpers after imports.
- [x] Docs synced (including **`help`**, architecture, commands index).

### Extractions (this sprint)

- **`missing`:** `readMissingPathsFromValidateReport`, `resolvePathsToAddForMissing` → `packages/cli/src/core/missing/paths.ts`; human list cap / preview → `core/missing/summary.ts`; shared `compareDottedPathDepth` exported from `core/validate/missingLiterals.ts`.
- **`fill`:** `fillOneLocale` + dry-run summary → `packages/cli/src/core/fill/` (`fillLocale.ts`, `summary.ts`); interactive target picker → `core/fill/prompts.ts`; `listOtherLocaleCodes` → `core/locales/otherLocales.ts`.
- **`sync`:** template merge+prune + change detection → `core/sync/apply.ts` (`computeSyncedLocaleJson`).
- **`cleanup` / `generate`:** unused-key candidate computation + string-presence resolution → `core/cleanup/` (`candidates.ts`, `stringPresence.ts`); locale build loop + shape helpers → `core/generate/` (`buildLocale.ts`, `shape.ts`).

## Next step

Start the **[exports](./exports/README.md)** phase: namespace-based public API, typed contracts, and package entrypoints aligned with `core/` boundaries.
