---
description: ADR 003 — opt-in patching integrates generated locale loaders with app i18n config after mutations.
---

# ADR 003 — User i18n loader and config integration (opt-in)

**Status:** Proposed  
**Date:** 2026-04-15  
**Deciders:** Abdisamed Mohamed  
**Related ADRs:** [ADR 004](./004-auto-patch.md) (opt-in auto-patching), [ADR 002](./002-configurable-translation-calls.md) (configurable translation calls)

## Context

Teams often maintain a runtime i18n module (loader, `createI18n`, resources) alongside tooling config (`i18nprune` paths and `functions`).

The CLI must not execute user apps, but we still want optional recognition of documented patterns and, later, safe template updates.

## Decision

Treat user i18n wiring as an **opt-in, read-only** integration by default:

- Default: i18nprune relies only on `i18nprune.config` + locale JSON + source scan, with no requirement to expose a loader file.
- Optional future: users may point at files that match **versioned patterns** in documentation.
- Safety: if patterns do not match, the tool warns and does not rewrite user files; strict non-interactive contexts may fail (exact flags TBD).
- Auto-patching (future) stays explicit: preview first, never silent.

## Implementation

- Keep recognition paths behind documented config entry points, and implement them as read-only checks.
- When wiring is unknown, surface “aligned vs unknown” signals in `doctor` / `validate` without blocking core commands unless strict mode is enabled.

## Consequences

### Positive

- Correctness and trust: we avoid “guessing” runtime wiring.
- Clear future path to safe template updates.

### Negative

- Integration depth is intentionally limited in v0.x.

### Mitigation

- Prioritize validation quality (`validate` / `sync` / `cleanup`) until loader recipes and patching semantics are fully specified.
- Publish loader patterns and failure semantics in docs so users know what to expect.

## Alternatives Considered

### Mandatory loader recognition

- **Pros:** Stronger immediate insights.
- **Cons:** Forces loader exposure and risks incorrect guesses.

### Heuristic-only framework wiring detection

- **Pros:** Less user configuration.
- **Cons:** Fragile; false positives break trust, and it expands scope beyond v0.x.

## References

- [User-project loader & config](../../patching/loader.md)
- [ADR 002](./002-configurable-translation-calls.md)
- [ADR 004](./004-auto-patch.md)
