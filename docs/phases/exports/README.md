# Phase — Exports (combined)

**Status:** **Completed** — public `@zamdevio/i18nprune/core` surface, CLI **`--json`** contract, and programmatic **`run*`** helpers are shipped. Hub: [active-phase.md](../active-phase.md).

This folder holds **planning and history** for the exports / JSON / `core` surface. **Normative user docs** live under **`docs/json/README.md`**, **`docs/json/programmatic.md`**, and **`docs/exports/`**.

## What shipped (single checklist)

- [x] Command-orchestrator boundary ([commands phase](../commands.md) + ADR 006).
- [x] Namespaced `core` facade + flat re-exports (`packages/cli/src/exports/core.ts`, `exports/namespaces/*`).
- [x] Stable vs Advanced classification ([exports/core.md](../../exports/core.md)).
- [x] CLI JSON envelope `{ ok, kind, data, issues, meta }` for all **`COMMANDS_WITH_JSON_OUTPUT`** ([json/README.md](../../json/README.md)).
- [x] **`issues[]`** + issue-code registry ([issue codes](../../json/issue-codes.md)).
- [x] Programmatic **`tryResolveContext`**, **`stringifyEnvelope`**, **`run*`** for envelope commands ([programmatic.md](../../json/programmatic.md)).
- [x] Types: envelope in `packages/cli/src/types/core/json/envelope.ts`; command payloads under `types/command/*/json.ts` where applicable.

## Companion notes (same phase)

| Doc | Focus |
|-----|-------|
| [api-surface.md](./api-surface.md) | Namespaces, semver tiers, `run*` naming |
| [docs-sync.md](./docs-sync.md) | Keeping `docs/` and the Nextra app in sync |
| [apps-detach-foundation-alignment.md](./apps-detach-foundation-alignment.md) | Monorepo layout vs original plan |

## Residual ideas (not tracked here)

Optional later work (product decision): richer **`summary`** footer lines with **`issues[]`**, or extra alignment between global **`--report-file`** and stdout envelopes. File an issue or a new phase when scope is concrete.

## Execution order (historical)

1. Lock command-orchestrator boundary.
2. Namespaced public API in `packages/cli/src/exports/*`.
3. Stable vs advanced classification in `docs/exports/core.md`.
4. Align CLI JSON with typed `data` payloads + envelope.
5. Single JSON spec: `docs/json/README.md`; programmatic pointers in `docs/json/programmatic.md`.
