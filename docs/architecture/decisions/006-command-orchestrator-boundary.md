# ADR 006 — Command Modules Are Orchestrators

## Status: Accepted

## Context

The CLI has grown across multiple commands. To keep the codebase maintainable and make `@zamdevio/i18nprune/core` easy to integrate, we need a strict boundary between command wiring and reusable logic.

## Decision

- `packages/cli/src/commands/*` modules are orchestration-only.
- Reusable/business logic lives in `packages/cli/src/core/**`.
- Shared helper behavior may live in `packages/cli/src/utils/**` when it is cross-cutting and not domain-specific.

Command modules may keep user-flow concerns (prompts, confirmations, summaries), but not reusable domain behavior.

**Physical layout:** within `packages/cli/src/commands/<name>/`, prefer **`index.ts`** for re-exports and **`run.ts`** for the primary handler, with optional co-located orchestration-only helpers — see [Command orchestration boundary — file layout](../../commands/orchestration/README.md#file-layout-inside-a-command-package) and [Phase: commands](../../phases/commands.md) (checklist).

## Consequences

### Positive

- Cleaner namespace-based exports from core.
- Better integration ergonomics for external consumers.
- Easier testability of domain logic without CLI harnessing.
- Lower coupling between CLI UX and engine behavior.

### Trade-offs

- Requires discipline and occasional extraction refactors.
- Some command files may need periodic cleanup to preserve boundary.

## References

- [Command orchestration boundary](../../commands/orchestration/README.md)
- [Phase: commands](../../phases/commands.md)
- [Phase: exports](../../phases/exports/README.md)
