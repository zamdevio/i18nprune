# ADR 004 — Opt-in auto-patching for runtime i18n wiring

**Status:** Accepted  
**Date:** 2026-05-12  
**Deciders:** Abdisamed Mohamed  
**Related ADRs:** [ADR 003](./003-user-i18n-loader-integration.md) (opt-in loader recognition), [ADR 006](./006-command-orchestrator-boundary.md) (CLI orchestration boundary)

## Context

Application code often needs to stay aligned with locale files: lazy imports for new JSON bundles, language pickers, feature flags tied to supported languages.

Doing that by hand is repetitive; doing it automatically without constraints risks **silent corruption** or **unreviewable diffs**. The CLI therefore needs a **bounded** automation story that respects user ownership of source files outside `localesDir`.

## Decision

Auto-patching is:

- **Opt-in**
- **Recipe-based**
- **Fail-closed** when recognition fails

Key constraints:

- **Split surfaces:** loader wiring (resource maps, lazy imports) and product-level language configuration may live in different files; we do not assume a single canonical module unless a documented recipe describes that layout.
- **Declared integration:** supported layouts are named recipes with configuration hooks, required identifiers, and published documentation so teams can adopt deliberately.
- **No silent writes:** unrecognized/ambiguous files are not modified; runs surface warnings and can use non-zero exit codes where configured for strict automation.

## Implementation

- Centralize recipe implementations under `packages/cli/src/core/patching/` as small, testable units per recipe.
- Drive configuration and validation via `docs/patching/**` (user-facing contract).

## Consequences

### Positive

- Better trust and auditability: users see exactly what recipe applied and when it fails.
- Changes remain reviewable (no “magic” global patching).
- Safer default: opt-in keeps existing repos on the manual path.

### Negative

- More documentation and recipe scaffolding for each new supported integration surface.
- Users may need to opt in and provide config instead of relying on “best effort”.

### Mitigation

- Maintain a clear “fail-closed” rule and keep warning/non-zero exit semantics documented.
- Keep recipes minimal, testable, and tied to explicit integration documentation.

## Alternatives Considered

### Heuristic-only auto-patching

- **Pros:** Less user setup.
- **Cons:** Breaks trust due to false positives; risk of silent corruption.

### Always-on auto-patching

- **Pros:** Easiest onboarding for a subset of users.
- **Cons:** Unacceptable risk profile for v0.x; produces diffs without explicit intent.

## References

- [patching — user guide](../../patching/README.md)
- [Release notes](https://releases.i18nprune.dev)
