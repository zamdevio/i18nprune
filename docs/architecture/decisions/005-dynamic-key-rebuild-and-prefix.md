---
description: ADR 005 — dynamic keys, per-file const maps, and partial prefix handling for static analysis limits.
---

# ADR 005 — Dynamic key rebuild, const map, and partial prefixes

**Status:** Accepted  
**Date:** 2026-05-17  
**Deciders:** Abdisamed Mohamed  
**Related ADRs:** [ADR 002](./002-configurable-translation-calls.md), [ADR 006](./006-command-orchestrator-boundary.md)

## Context

Translation calls with a **template literal** first argument often look “dynamic” because of `` `${…}` ``, even when most of the key path is **static** and only a few segments depend on runtime values or unresolved bindings.

Static analysis cannot execute user code, but many codebases repeat patterns such as:

- A file-level **`const NS = 'some.namespace'`** and `` t(`${NS}.page.title`) ``.
- A long dotted path with a **runtime-only** segment in the middle: `` t(`app.section.${id}.label`) ``.

Without special handling, every such call is classified as non-literal, which **over-reports** “dynamic” usage and weakens trust in **`validate`** and **`locales dynamic`**.

## Decision

1. **Const string map** — Reuse the same **`buildConstStringMap`** (`packages/cli/src/core/constmap/build.ts`) that powers **`exactLiteralKeys`**: collect `const Name = 'value'` pairs from the current file (or merged scan text).

2. **Full rebuild** — For template inner text, run **`resolveKeyPlaceholders`** (`packages/cli/src/core/constmap/resolve.ts`). If every `${Ident}` refers to a known const and the result has **no** remaining `${…}`, treat the call as **fully static** and **do not** emit a dynamic site.

3. **Partial prefix** — If rebuild fails, compute **`resolvedPrefix`**: the substring **before** the first `${…}` that cannot be resolved (or is not a simple identifier), then substitute known `${Ident}` values in that prefix only. Expose this on **`DynamicKeySite`** for tooling and future **cleanup** alignment. Require at least one **`.`** in the prefix so single-segment roots stay conservative.

4. **Extension-only providers** — Language-specific analysis stays in **`packages/cli/src/core/extractor/dynamic/providers/`**; source discovery remains **extension-based**, not folder-name heuristics.

5. **Comments** — Comment regions are detected separately; call sites inside comments use kind **`commented`**.

## Implementation

```ts
const NS = 'some.namespace';
t(`${NS}.page.title`);
```

- **Same map** for literals and dynamic filtering avoids drift between **`validate`** and dynamic reporting.
- **Rebuild** turns a large class of “looks dynamic, is actually constant” calls into **zero** dynamic noise.
- **Partial prefix** documents *what part* of the key path is still trustworthy when the full key is unknown—without claiming a false static key.
- **No runtime execution** preserves safety; we only substitute **simple identifiers** present in the const map.

## Consequences

### Positive

- **`DynamicKeySite`** may include **`resolvedPrefix`** for **`template_interpolation`**.
- **`i18nprune/core`** exports **`tryRebuildTemplateKeyFromConsts`** and **`tryResolveTemplatePrefixBeforeUnknown`** for scripts that mirror CLI rules.
- Large projects that rely on namespace `const`s should see **fewer** reported dynamic sites when those templates become statically rebuildable.

### Negative

- Placeholders that cannot be resolved from consts remain dynamic by design (no runtime execution), even if most of the path is static.

### Mitigation

- Optional **const aliases** resolved via imported key objects (requires config or analysis of imports).
- **String-array** patterns (`const keys = ['a.b', …]`) and **`t(k)`** loops—shared with cleanup **used-key** logic.
- Optional **ripgrep** verification for high-assurance CI.

## Alternatives Considered

### Treat every template literal as dynamic
- **Pros**: simpler classification rules.
- **Cons**: over-reports dynamic usage; weakens trust in CI gating.

### Full rebuild only (no partial prefix)
- **Pros**: avoids any “confidence gradient” and keeps output strictly conservative.
- **Cons**: reduces value for tooling because it would stop describing what *is* trustworthy.

## References

- [Dynamic key handling](../extraction/dynamic.md)
- [ADR 002 — Configurable translation calls](./002-configurable-translation-calls.md)
- [Extraction architecture](../extraction/README.md)
