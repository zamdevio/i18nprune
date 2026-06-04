# ADR 002 — Configurable translation call sites for key extraction

**Status:** Accepted  
**Date:** 2026-04-15  
**Deciders:** Abdisamed Mohamed  
**Related ADRs:** [ADR 001](./001-scope-v0-1.md) (CLI scope and JSON contract), [ADR 005](./005-dynamic-key-rebuild-and-prefix.md) (dynamic key handling)

## Context

**Validate** (and any future lint-style features) need to know which **function calls** represent translation lookups, e.g. `t('screen.title')`, `i18n.t('screen.title')`, `$t('screen.title')`.

Real codebases differ in import aliases, namespaces, and wrappers. We therefore had to choose between:

- hard-coding one pattern,
- regex-only heuristics with no config, or
- a declarative config listing acceptable call shapes.

The tool needs a **configurable** story for translation calls.

## Decision

Expose a **`functions`** field on the i18nprune config: a list of **base callee names** the extractor treats as translation functions for **string literal** first arguments (with optional chaining and simple wrappers as implemented in `packages/cli/src/core/extractor/`).

## Implementation

Example config:

```json
{
  "functions": ["t", "i18n.t"]
}
```

The extractor walks the configured patterns; `validate` then checks that extracted keys exist in the source locale JSON.

## Consequences

### Positive

- Teams explicitly control which helpers count, and the same list can power documentation and consistency checks.

### Negative

- Users must maintain `functions` when helpers are renamed.
- Dynamic keys are intentionally out of scope for this particular mechanism.

### Mitigation

- Provide sensible defaults for common helpers and document when/how to update `functions`.
- Treat extractor behavior changes as user-facing and document them on [releases.i18nprune.dev](https://releases.i18nprune.dev) for major bumps.

## Alternatives Considered

### Hard-coded “t-only” extraction

- **Pros:** Minimal configuration.
- **Cons:** Breaks most real codebases with aliases/wrappers.

### Regex-only heuristics

- **Pros:** Simple to implement.
- **Cons:** Produces false positives and breaks on formatting; weak trust for CI gating.

## References

- `packages/cli/src/core/extractor/` — literal and template handling
- [Validate command](../../commands/validate.md)
