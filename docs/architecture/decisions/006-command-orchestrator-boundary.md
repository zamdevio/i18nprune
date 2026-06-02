# ADR 006 — Command Modules Are Orchestrators

**Status:** Accepted  
**Date:** 2026-05-12  
**Deciders:** Abdisamed Mohamed  
**Related ADRs:** [ADR 001](./001-scope-v0-1.md) (CLI scope), [ADR 007](./007-cli-json-envelope-contract.md) (host-facing JSON contract)

## Context

The CLI has grown across multiple commands. To keep the codebase maintainable and make `i18nprune/core` easy to integrate, we need a strict boundary between command wiring and reusable logic.

## Decision

1. `packages/cli/src/commands/*` modules are orchestration-only.
2. Reusable/business logic lives in `packages/core` (`runXxx` entries under `packages/core/src/<op>/`).
3. Shared CLI helper behavior may live in `packages/cli/src/utils/**` when it is cross-cutting and not domain-specific.
4. Command modules may keep user-flow concerns (prompts, confirmations, summaries), but not reusable domain behavior.

**Physical layout:** within `packages/cli/src/commands/<name>/`, prefer `index.ts` for re-exports and `run.ts` for the primary handler, with optional co-located orchestration-only helpers.

## Implementation

Conventions to enforce in PRs:

```text
packages/cli/src/commands/<name>/index.ts   # re-export surface
packages/cli/src/commands/<name>/run.ts      # primary handler (orchestrates)
```

## Consequences

### Positive

- Cleaner namespace-based exports from core.
- Better integration ergonomics for external consumers.
- Easier testability of domain logic without CLI harnessing.
- Lower coupling between CLI UX and engine behavior.

### Negative

- Requires discipline and occasional extraction refactors.
- Command files can accumulate orchestration cruft without periodic cleanup.

### Mitigation

- Treat boundary as a maintained contract: prefer `runXxx` in core for reusable logic and keep CLI glue thin.
- Keep JSON contract tests parity-safe so orchestration changes are caught by CI.

## Alternatives Considered

### Put domain logic inside CLI commands

- **Pros:** Quick to implement early.
- **Cons:** Harder to reuse from SDK/hosts; testing and refactors become CLI-specific.

### Share code only via CLI utils (no core)

- **Pros:** Fewer packages and file boundaries.
- **Cons:** Locks semantics into CLI; increases drift across runtimes (Node vs browser vs worker).

## References

- [Commands index](../../commands/README.md)
- [SDK operations](../../sdk/operations.md)
