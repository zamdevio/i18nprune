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
- **Owner / phase:** `maintainer/phases/extractor.md` (C.1.3); tests in `packages/core/src/extractor/shared/__tests__/calls.test.ts`.

### extractor-reassignment-alias

- **ID:** `extractor-reassignment-alias`
- **Surface:** `core`
- **Status:** `open`
- **Impact:** Translation calls made through a **renamed local** (`const tt = t; tt('key')`) are not tied to configured `t` without dataflow.
- **Current behavior:** Regex + import-binding expansion enriches `functions` from **imports** and module patterns (`i18n.t`, aliases, etc.). It does **not** follow assignment or control flow, so `tt` is not expanded from `t`.
- **Target behavior:** Optional future host hooks or scoped heuristics (high risk of false positives if done generically).
- **Workaround:** Call the helper under its imported/local name from config, or add the alias name to `functions` if it is stable project-wide.
- **Owner / phase:** `maintainer/phases/extractor.md` (known limits); `docs/extractor/README.md` limits.

### extractor-hook-return-destructuring

- **ID:** `extractor-hook-return-destructuring`
- **Surface:** `core`
- **Status:** `planned`
- **Impact:** Framework patterns such as `const { t } = useTranslation()` (runtime return) are not resolved from imports alone.
- **Current behavior:** No model of hook return shapes; `t` from destructuring is invisible unless listed in `functions` **and** the call site uses that binding name from an import binding we can see (still won’t connect hook-only locals without extra config).
- **Target behavior:** Framework-specific presets or optional AST-backed assist **after** JS/TS extractor is stable; see init / extension phases.
- **Workaround:** Configure explicit `functions` entries for locals you use, or re-export a thin wrapper `export const t = …` that import scan can see.
- **Owner / phase:** `maintainer/phases/extractor.md`; `maintainer/phases/shipped-slices.md` (init) / extension docs for presets.

Add entries as soon as an unresolved behavior is accepted as known, even if implementation is not scheduled.
