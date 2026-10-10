---
description: Tracked extractor and policy gaps — remaining multi-hop / HOC prop limits and planned detection rules.
---

# Unsolved edge-case inventory

This page tracks known unsolved behavior and policy gaps. Keep entries short, concrete, and actionable.

## Entry template

Use this shape for every new inventory item:

- **ID:** stable slug, e.g. `dynamic-template-partial-prefix`
- **Surface:** `cli` | `json` | `docs` | `web` | `core`
- **Status:** `open` | `monitoring` | `planned`
- **Impact:** short user-facing impact statement
- **Current behavior:** what happens now
- **Target behavior:** what we want
- **Workaround:** if available
- **Owner / phase:** where it is tracked

## Current inventory

### extractor-prose-first-arg-filter

- **ID:** `extractor-prose-first-arg-filter`
- **Surface:** `core`
- **Status:** `monitoring`
- **Impact:** Rare false positives or false negatives on the first translation-call argument when it is not a normal JS expression.
- **Current behavior:** `findTranslationCallSites` skips calls whose trimmed first argument is **two or more whitespace-separated tokens** that are each **ASCII `[a-z]+` only** (Session C.1.3). This removes common prose junk (e.g. `t(or vice versa)`) including inside comments for dynamic scan.
- **Target behavior:** Optionally tighten or relax rules with fixtures (numbers, punctuation, Unicode prose, single-word false positives) without breaking real call shapes.
- **Workaround:** Use string/template literal keys where possible; rename misleading identifiers near `t(` if a false positive appears.
- **Owner / phase:** `maintainer/phases/extractor/README.md` (C.1.3); tests in `packages/core/src/extractor/shared/__tests__/calls.test.ts`.

### extractor-reassignment-alias

- **ID:** `extractor-reassignment-alias`
- **Surface:** `core`
- **Status:** `shipped` (HOC §A — one-hop only)
- **Impact:** Translation calls made through a **renamed local** (`const tt = t; tt('key')`) were not tied to configured `t` without dataflow.
- **Current behavior:** Same-file **one-hop** aliases expand into effective helpers (`const tt = t`, `const translate = i18n.t`). Multi-hop and ternaries are not followed.
- **Target behavior:** Optional multi-hop / light-dataflow later — see [`maintainer/phases/extractor/hoc.md`](../../../maintainer/phases/extractor/hoc.md) · [`light-dataflow.md`](../../../maintainer/phases/extractor/light-dataflow.md).
- **Workaround:** (n/a for one-hop) Call under the imported name, or add a stable alias to `functions`.
- **Owner / phase:** [`maintainer/phases/extractor/hoc.md`](../../../maintainer/phases/extractor/hoc.md) §A; tests in `packages/core/src/extractor/bindings/__tests__/localHelpers.test.ts`.

### extractor-hook-return-destructuring

- **ID:** `extractor-hook-return-destructuring`
- **Surface:** `core`
- **Status:** `shipped` (HOC §A — preset hooks)
- **Impact:** Framework patterns such as `const { t } = useTranslation()` (runtime return) were not resolved from imports alone when `t` was absent from `functions`.
- **Current behavior:** Preset table (`useTranslation` / `useTranslations` → bind `t`) plus runtime named import evidence expands local `t`. Renamed binds (`t: translate`) not yet.
- **Target behavior:** Optional renamed destructuring; namespace propagation remains hint-only.
- **Workaround:** Include `t` in `functions` (most presets already do), or add the local alias name.
- **Owner / phase:** [`maintainer/phases/extractor/hoc.md`](../../../maintainer/phases/extractor/hoc.md) §A.

Add entries as soon as an unresolved behavior is accepted as known, even if implementation is not scheduled.
