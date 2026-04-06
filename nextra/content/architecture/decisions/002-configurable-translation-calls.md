# ADR 002 — Configurable translation call sites for key extraction

## Status: Accepted

## Context

**Validate** (and any future lint-style features) need to know **which function calls** represent translation lookups, e.g. `t('screen.title')`, `i18n.t('screen.title')`, `$t('screen.title')`. Real codebases differ in import aliases, namespaces, and wrappers. We had to choose between **hard-coding** one pattern, **regex-only** heuristics with no config, or a **declarative config** that lists acceptable call shapes. The tool therefore needs a **configurable** story for **translation calls** (same concept as **`functions`** for **`generate`** / **`fill`** / **`sync`**).

## Decision rationale

Expose a **`functions`** field on the i18nprune config: a **list of base callee names** the extractor treats as translation functions for **string literal** first arguments (with optional chaining and simple wrappers as implemented in `src/core/extractor/`).

Example:

```json
{
  "functions": ["t", "i18n.t"]
}
```

The extractor walks the configured patterns; **validate** then checks that extracted keys exist in the **source locale JSON**.

## The Why

A **single global name** (`t` only) breaks most real codebases. **Auto-detect from imports** would require full program analysis, be slow, and remain brittle. **Per-directory override files** add merge-order complexity — deferred. **Regex-only** extraction produces false positives and breaks on formatting. **AST extraction + configurable callees** balances accuracy and control.

## Consequences

**Positive:** Teams opt in to which helpers count; the same list drives documentation.

**Negative:** Users must **maintain** `functions` when renaming helpers. **Dynamic keys** remain unsupported by design.

**Operational:** Defaults cover common cases; extractor changes belong in the changelog and major bumps when behaviour shifts.

## See also

- `src/core/extractor/` — literal and template handling
- [Validate command](../../commands/validate/README.md)
