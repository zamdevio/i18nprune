---
description: "Analysis for future config and detection rules. Nothing here is a commitment to ship every knob as written; use it to document trade-offs before changing…"
---

# Edge-case policy framework (pre-implementation)

Analysis for **future** config and detection rules. Nothing here is a commitment to ship every knob as written; use it to document **trade-offs** before changing defaults.

---

## Evaluation dimensions

For each pattern, consider:

| Dimension | Question |
|-----------|------------|
| **Validity** | Why might this pattern be intentional or legitimate? |
| **FP risk** | How often might valid keys be incorrectly flagged? |
| **FN risk** | How often might broken keys slip through? |
| **Perf cost** | AST depth, cross-file work, regex cost? |
| **Config strategy** | Opt-in flag, whitelist, or hard rule? |

---

## Ranked patterns (examples)

### 1. Dynamic template literal keys

```ts
t(`seo.routes.${routeId}.title`) // resolvedPrefix: "seo.routes"
```

- **Why valid:** Route params, IDs, feature flags are often dynamic.
- **FP risk:** High — `routeId` may not resolve statically; tool may mark an uncertain prefix.
- **FN risk:** Medium — missing translations for specific values may not be caught.
- **Perf:** Low (prefix extraction is cheap).
- **Possible config (illustrative):** `policies.dynamicKeys`: `allowTemplateInterpolation`, `requireResolvedPrefix`, `maxInterpolationDepth`.

### 2. Non-literal variable keys

```ts
t(item.labelKey, item.labelInterpolation ?? {}) // kind: "non_literal"
```

- **FP risk:** Very high — limited static analysis.
- **FN risk:** High — typos in runtime-held keys are hard to see.
- **Possible config:** whitelists, `treatAsRuntime`, opt-in strictness.

### 3. Commented-out translation calls

- **FP risk:** Medium if commented sites are treated like runtime.
- **FN risk:** Low — commented code does not run.
- **Aligns with:** `reference.defaults.treatCommentedCallSitesAsRuntime` (and related docs).

### 4. Keys in non-source files

Tests, config, scripts — may need path filters and `treatNonSourceFileSitesAsRuntime`-style behavior.

### 5. Nested / conditional template interpolation

Optional chaining, ternaries, nested `t()` — higher analysis cost; may need depth limits and “uncertain” classification.

### 6. Keys with fallback / default values

Trade-off between hiding missing keys and respecting intentional defaults.

### 7. Cross-file prop drilling

Tracing `props.labelKey` to literals is expensive; typically opt-in or whitelist-based.

### 8. Build-time / macro-generated keys

Pattern-based trust, annotations, or validation-only rules.

### 9. Special characters / delimiters in keys

Parser and policy must stay consistent with real-world namespaces.

### 10. Feature-flagged keys

Optional reporting for “unused” keys behind flags.

---

## Recommended strategy (before 1.0)

1. Default to **conservative** validation where uncertainty is explicit.
2. Provide **escape hatches** (whitelists, `treatAsRuntime`, policies).
3. Document **trade-offs** in `docs/config/policies.md` and related pages when a knob ships.
4. Keep **expensive** analysis (cross-file prop tracing, deep expression evaluation) **opt-in**.
5. Use **`uncertainKeyPolicy`** (and related reference defaults) as the coarse control — see existing `reference.defaults` docs.

---

## Risk matrix (quick reference)

| Pattern | FP risk | FN risk | Perf | Default direction (illustrative) |
|---------|---------|---------|------|----------------------------------|
| Template interpolation | High | Medium | Low | Allow + warn |
| Non-literal variables | Very high | High | Low | Flag + whitelist |
| Commented calls | Medium | Low | Low | Ignore by default |
| Non-source files | Medium | Low | Low | Exclude / runtime by default |
| Nested conditionals | High | High | Medium | Flag + limits |
| Fallback values | Medium | Medium | Low | Warn-only options |
| Prop drilling | Very high | High | High | Off by default |
| Codegen / macro keys | Medium | Low | Low | Pattern-based rules |
| Special characters | Medium | Low | Low | Configurable parsing |
| Feature flags | Medium | Medium | Low | Optional reporting |

---

## Bottom line

Each future rule should ship with a **reliability contract**: what users gain, what noise or misses they should expect, and how to tune it. This page is the umbrella; concrete defaults live next to the config schema and command behavior as features land.
