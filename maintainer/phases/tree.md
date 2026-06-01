# Tree & naming phase

**Status:** **Planned** — after **[`cross-platform.md`](./cross-platform.md)** (Session XP).  
**Hub:** [`V1-RELEASE.md`](./V1-RELEASE.md) · **Active narrative:** [`active-phase.md`](./active-phase.md).

**PR discipline:** one domain slice per PR · `pnpm typecheck` · `pnpm test` · parity when CLI output changes.

---

## Why this phase

The repo has grown fast across core, CLI, report, web, and workers. Contributor speed now depends on predictable file locations more than new abstractions. This phase standardizes layout so a contributor can jump between logic, types, and tests with near-zero lookup cost.

Primary outcomes:

- faster navigation and onboarding
- less import/path drift
- simpler refactor mechanics
- lower chance of duplicated models

## Scope

This phase defines tree rules only. It does not change runtime behavior.

In scope:

- logic/type path parity
- test path parity
- barrel patterns for domain and sub-domain folders
- file split/merge heuristics
- naming normalization

Out of scope:

- feature behavior changes
- API semantics changes
- migration shims for old internal paths

## Target Structure Rules

### 1) Logic and type path parity

For any logic path:

- `src/<domain>/<sub-domain>/index.ts`

Use a matching type path:

- `src/types/<domain>/<sub-domain>/index.ts`

If types are small, keep them in that `index.ts`. If they become large, split into minimal child scripts in the same folder.

### 2) Tests mirror logic

Tests stay with logic code:

- `src/<domain>/<sub-domain>/__tests__/`

Default form:

- `__tests__/<logic-file>.test.ts`

Use sub-dirs inside `__tests__/` only when test volume or fixture structure requires it.

### 3) Barrels are mandatory at domain edges

Each domain/sub-domain directory with child scripts must expose an `index.ts` barrel for stable imports.

No deep-import-only domains.

### 4) Minimal files by default

Prefer fewer, clear files when scope is small:

- combine closely related logic + interface/type scripts when separation adds no value
- split only when file size, ownership boundaries, or concern separation justify it

### 5) Split large files into focused scripts

When a file becomes large or multi-purpose:

- split by cohesive concern (parse/build/validate/render/emit)
- keep naming short and direct
- keep parent directory barrel as the public entry

### 6) Naming policy

- names describe domain intent, not implementation history
- avoid transitional/legacy suffix naming
- keep file names aligned between logic/types/tests where possible

## Import Policy

- prefer folder-barrel imports for domain boundaries
- avoid stale path aliases after moves
- after each move, update all call sites immediately (no temporary dual paths)

## Migration Heuristics

For each target domain:

1. move or normalize types first
2. align logic barrel and child scripts
3. align tests naming and location
4. fix imports
5. run typecheck + tests

## Acceptance Criteria

A slice is complete when:

- logic/types path parity exists for the touched domain
- tests mirror logic paths and names
- no deep path drift remains for touched files
- barrels exist at touched domain edges
- `pnpm typecheck` and `pnpm test` pass

## Non-Goals

- preserving old internal path compatibility
- keeping legacy comments or transitional aliases

This phase explicitly prefers clean tree semantics over backward compatibility for internal-only structure.
