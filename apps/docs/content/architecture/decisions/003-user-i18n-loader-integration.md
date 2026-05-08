# ADR 003 — User-project i18n loader and config integration (opt-in)

## Status: Proposed

## Context

Teams often maintain a **runtime i18n module** (loader, `createI18n`, resources) alongside **tooling config** (`i18nprune` paths and `functions`). The CLI must not execute user apps, but we still want optional **recognition** of documented patterns and, later, **safe** template updates.

## Decision rationale

Treat **user i18n wiring** as an **opt-in, read-only** integration by default:

1. **Default:** i18nprune relies only on **`i18nprune.config` + locale JSON + source scan** — no requirement to expose a loader file.
2. **Optional future:** users may point at files that match **versioned patterns** in docs.
3. **Safety:** if patterns **do not match**, the tool **warns**, **does not rewrite** user files, and in strict non-interactive contexts may **fail** (exact flags TBD).
4. **Auto-patch** (future) is **explicit**, always with **preview**, never silent.

## The Why

**Correctness:** Guessing framework wiring breaks trust; static pattern matching stays intentionally narrow. **Scope:** v0.x prioritises validate / sync / cleanup correctness over deep framework coupling until recipes and patching are fully specified (see [ADR 004](./004-auto-patch.md)).

## Consequences

Until integration ships, **`doctor` / `validate`** may report **aligned** vs **unknown** wiring without blocking core commands unless **strict** mode is requested.

## See also

- [User-project loader & config](../../patching/loader.md)
- [ADR 002](./002-configurable-translation-calls.md)
- [ADR 004](./004-auto-patch.md)
