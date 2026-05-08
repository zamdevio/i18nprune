# ADR 004 — Opt-in auto-patching for runtime i18n wiring

## Status: Accepted

## Context

Application code often needs to stay aligned with locale files: lazy imports for new JSON bundles, language pickers, feature flags tied to supported languages. Doing that by hand is repetitive; doing it automatically without constraints risks **silent corruption** or **unreviewable diffs**. The CLI therefore needs a **bounded** automation story that respects user ownership of source files outside **`localesDir`**.

## Decision rationale

Auto-patching is **opt-in**, **recipe-based**, and **fail-closed** when recognition fails.

- **Split surfaces** — Loader wiring (resource maps, lazy imports) and product-level language configuration may live in **different files**. The tool does not assume a single canonical module unless a documented recipe describes that layout.
- **Declared integration** — Each supported layout is a **named recipe** with configuration hooks, required identifiers, and **published documentation** so teams can align their code **deliberately**.
- **No silent writes** — Unrecognised or ambiguous files are **not** modified; the run surfaces **warnings** and (where configured) **non-zero exits** for strict automation.

## The Why

Implicit or heuristic-only patching optimises for a short-term “it worked once” moment at the cost of **trust** and **auditability**. A single global file assumption fits some projects but fails many real codebases. **Opt-in** keeps the default path **safe** for existing repos while still giving adopting teams a **predictable** upgrade path. **Explicit recipes** make CI and code review meaningful: changes are **attributable** to a named integration, not a best guess.

## Consequences

- **Config** gains optional patching fields as the feature ships; see [patching](../../patching).
- **Implementation** is centralised under **`packages/cli/src/core/patching/`** with small, testable units per recipe.
- **Documentation** is part of the contract: each recipe ships with **required** shapes and **failure** semantics.

## See also

- [patching — user guide](../../patching)
- [Roadmap](../../roadmap)
