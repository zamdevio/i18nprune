# Topology — Overview

## Scope

This page maps the major repository domains and who owns each boundary.

## System map

- **CLI host**: `packages/cli/**`
  - argv parsing, command entrypoints, prompt/TTY behavior, human summaries
- **Core domain**: `packages/core/**`
  - shared domain logic, runtime-neutral data operations, translator internals
- **Report package/app**: `packages/report/**`, `apps/report/**`
  - report rendering assets and web presentation
- **Public docs**: `docs/**` + `apps/docs/**`
  - published documentation content and site build/runtime
- **Maintainer docs**: `maintainer/**`
  - phase plans, release sequencing, internal architecture notes
- **Tests**: `packages/**/__tests__` + `tests/integration/**`
  - unit coverage, integration fixtures, command-level behavior checks

## Boundaries

- Public contract surfaces:
  - CLI argv behavior
  - `--json` envelope shape
  - issue codes and exit behavior
- Internal surfaces:
  - core-only helper APIs
  - maintainer phase docs and in-flight refactor plans

## Current vs planned

- **Shipped:** orchestration ownership lives in core `runXxx` entries; CLI acts as a thin host shell.
