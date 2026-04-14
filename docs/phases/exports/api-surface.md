# Exports API Surface

## Goals

1. Expose predictable, discoverable symbols from `packages/cli/src/exports/core.ts` (and `/config` if needed).
2. Export stable/safe capabilities without leaking unstable internals.
3. Keep CLI-only concerns out of `@zamdevio/i18nprune/core`.

## Risk

Over-exposing unstable internals as semver-stable APIs.

Mitigate with:
- Stable/Advanced/Internal tiers
- Decision records under `docs/architecture/decisions/` when a choice spans code + docs
- Conservative defaults (export less first)

## Tiers

| Tier | Meaning |
|------|---------|
| Stable | Intended integrations; breaking changes are major |
| Advanced | Documented sharp edges |
| Internal | Not exported |

## Namespaces over classes

Public API uses grouped namespaces (`json.*`, `extractor.*`, `dynamic.*`, `validate.*`, `reference.*`, `context.*`, `ask.*`) plus flat re-exports.

## Naming convention

| Prefix | Meaning |
|--------|---------|
| `scan*` | read-only discovery |
| `compute*` | pure deterministic derivation |
| `resolve*` | config/context/path resolution |
| `run*` | side effects / workflows that return the same **`CliJsonEnvelope`** as CLI **`--json`** |

## Key-sites alignment

Keep `extractor` and `dynamic` as separate namespaces with different trust levels.

## Work checklist (exports phase)

- [x] Audit current exports vs internal capabilities (`exports/core.ts` + namespace modules).
- [x] Classify Stable/Advanced/Internal (table in `docs/exports/core.md`).
- [x] Implement grouped/namespaced public surface (`export * as` domains on `@zamdevio/i18nprune/core`).
- [x] Add flow-level `run*` exports for every command in `COMMANDS_WITH_JSON_OUTPUT` (including **`generate`**, **`report`**).
- [x] Document CLI JSON contract in [`docs/json/README.md`](../../json/README.md) (canonical spec).
- [x] `package.json` exports: primary **`core`** / **`config`** entrypoints maintained.
