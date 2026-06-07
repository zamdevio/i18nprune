---
description: ADR 001 — one installable CLI with explicit subcommands for local and CI i18n maintenance in v0.x.
---

# ADR 001 — Scope and shape of the v0.x CLI

**Status:** Accepted  
**Date:** 2026-04-15  
**Deciders:** Abdisamed Mohamed  
**Related ADRs:** [ADR-006](./006-command-orchestrator-boundary.md) (command vs core boundary)

## Context

We needed a tool that teams can run **locally and in CI** to reduce i18n foot-guns: missing keys, divergent locale JSON, unsafe cleanup, and opaque translation runs. That implies a **single binary** with an explicit set of **subcommands** for the first major versions.

We rejected approaches that don’t scale across typical repo ownership or CI constraints:

- **Framework-only plugins** are great inside one stack (one bundler) but are awkward for polyglot repos or scripting.
- **Heavy TMS / cloud suites** can work when teams have process budget, but often fail the “no account / run in CI” requirement.
- **Ad-hoc scripts per repo** are flexible but hard to standardize; they rarely share one verbosity + JSON contract or one config merge order.
- **Monolithic “do everything” i18n platforms** are harder to reason about and slow to adopt.

## Decision

Ship **one** installable CLI binary, `i18nprune`, with subcommands that match v1-era workflows:

- Setup: `init`, `config`
- Correctness: `validate`, `sync`, `quality`, `review`
- Translation: `generate` and `generate --resume` (provider-backed)
- Maintenance: `cleanup` (optional rg)
- Reference: `languages`
- Ops: `doctor`
- Meta: `help`, `version`

Cross-cutting contract:

- global `--json`, `--quiet`, `--silent`
- central `logger`
- `RunOptions` initialized once in `preAction`
- `resolveContext()` for merged config and host paths

## Implementation

Example of the shared JSON contract:

```bash
i18nprune validate --json
i18nprune generate --resume --target ja --json
```

Key wiring lives in:

- `packages/cli/bin/cli.ts` (Commander, `preAction`, command list)
- `packages/cli/src/commands/**` (thin orchestration per subcommand)
- core `runXxx` entry points under `packages/core/src/<op>/run.ts`

## Consequences

### Positive

- One mental model for teams and automation.
- JSON mode can grow per command without fragmenting the contract.
- `doctor` remains a single CI preflight step.

### Negative

- The bundle includes provider + core even for “validate-only” users; acceptable for a CLI, but still a size trade-off.
- New subcommands must stay aligned with the shared `logger` and `RunOptions` wiring.

### Mitigation

- Keep JSON contract changes parity-safe via dedicated parity snapshot tests and documentation in `docs/cli/json.md`.
- Use the orchestrator boundary ADR (ADR 006) to prevent business logic drift into CLI glue.

## Alternatives Considered

### Multi-package tooling

- **Pros:** Can reduce install size.
- **Cons:** Introduces version skew and duplicates policy code across packages.

### Convention-only scripts

- **Pros:** Minimal initial adoption.
- **Cons:** Fails in monorepos and makes overrides hard to reason about; also fragments CI and JSON outputs.

## References

- [Architecture overview](../README.md)
- [Commands index](../../commands/README.md)
- [JSON output (`--json`)](../../cli/json.md)
