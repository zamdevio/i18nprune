# Extractor (JS / TS–like sources)

This page describes how **i18nprune** finds translation helper usage and keys in JavaScript, TypeScript, and JS-like single-file formats (e.g. `.vue`, `.svelte`). It complements per-command docs under `docs/commands/`.

---

## Design stance

- **Regex-first, no AST** in core: predictable cost, easier parity, explicit limits.
- **Three cooperating ideas:** import **bindings** (who `t` / `i18n.t` refers to), **const** maps for simple template prefixes, and **call-site** heuristics for literals vs dynamic keys.
- Maintainer engineering map: `maintainer/systems/extractor.md`.

---

## 1. Import binding scan (`scanImportBindings`)

**Input:** full file text.  
**Output:** a list of `ImportBinding` values (`packages/core/src/types/extractor/bindings/`).

### Normalized binding shapes

- **`named`:** `import { t as tr }`, `const { t } = require('…')`, `const { t } = await import('…')`, etc.  
  Fields: `imported`, `local`, `source` (`esm` \| `cjs_require` \| `dynamic_import` \| `ts_import_equals`), optional `isTypeOnly: true`.
- **`module`:** default or namespace object bindings, e.g. `import i18n from '…'`, `import * as i18n`, `const i18n = require('…')`, `import i18n = require('…')`, `import { default as i18n } from '…'`.  
  Fields: `local`, `moduleKind` (`default` \| `namespace`), `source`, optional `isTypeOnly`.

### Identifiers

Bindings use a Unicode-aware identifier pattern (not ASCII `\w` only), so names like `$t`, `_x`, or non-ASCII identifiers match when valid in JS.

### Reducing false positives before regex

The scanner **blanks** (replaces with spaces):

1. **Line and block comments** — full spans (string/template-aware walk, `extractor/shared/jslikeTextRanges`).
2. **String and template literal interiors only** — between the opening and closing quote or backtick, **without** removing the delimiters, so `from './m'` remains a valid literal for regex matchers while `import`-like prose inside the literal body is obscured. Template bodies are treated as one interior (including `` `${ ... }` `` text).

This greatly reduces noise; it does **not** attempt full lexical soundness inside every hypothetical embedding.

### Supported import-style patterns (high level)

| Category | Examples |
| :--- | :--- |
| ESM | `import { t }`, `import { t as tr }`, `import i18n`, `import * as i18n`, `import i18n, { t }`, `import { default as i18n }` |
| Type-only | `import type { … }`, `import type * as …`, `import type Foo from` → bindings marked `isTypeOnly` (ignored by expansion) |
| TS | `import i18n = require('…')` |
| CJS | `const { t } = require('…')`, `const { t: tr } = require('…')`, `const i18n = require('…')` |
| Dynamic | `const { t } = await import('…')`, `const i18n = import('…')` |

**Not supported (by design unless noted elsewhere):** non-literal `require`/`import()` argument, destructuring from a runtime value (`const { t } = i18n`), re-export / barrel indirection without a direct import in the same file, etc.

---

## 2. Expanding `functions` (`expandFunctionsWithBindings`)

**Input:** configured `functions: string[]` (from project config) + bindings from §1.  
**Output:** ordered list: unique configured entries first, then **discovered** identifiers sorted by UTF-16 code unit order.

### Named aliases

If a runtime `named` binding’s **imported** or **local** name appears in `functions`, the **local** identifier is added for direct calls (`tr('…')`).

### Module members

For each **method suffix** derived from:

- every configured **simple** name (no `.`), and  
- every runtime `named` binding whose **imported** or **local** intersects `functions` (so configuring only a local alias still picks up the canonical export name for `i18n.t()`),

…the expander adds on each runtime **`module`** binding’s `local`:

- `obj.method`, `obj?.method`
- if `method` is safe for embedding in quotes: `obj['method']`, `obj?.['method']`, `obj["method"]`, `obj?.["method"]`

---

## 3. Call sites and keys

After expansion, **call-site** detection (`findTranslationCallSites` and related pipelines) uses the expanded name list. Further behavior (literals, templates, dynamic classifications, commented code) lives with **keySites** and **dynamic** modules and is covered under command docs (e.g. `validate`, `locales dynamic`).

---

## 4. Known limits (honest checklist)

| Limit | Why |
| :--- | :--- |
| No dataflow | Aliases like `const x = t` or `foo(t)` are not traced. |
| Regex import scan | Nested `}` inside `{ … }` import clauses, or exotic syntax, may miss or mis-parse. |
| Template / string interiors | Bodies between delimiters are blanked; delimiters stay so import matchers still see `from '…'`. Imports **only** inside a `${ … }` hole share the template interior and are not scanned separately. |
| Hooks / framework magic | Patterns such as `useTranslation()` destructuring need dedicated config or future work — see `maintainer/phases/extractor.md`. |

---

## 5. Where to change code

| Task | Primary location |
| :--- | :--- |
| New import form | `packages/core/src/extractor/bindings/imports.ts` + tests under `bindings/__tests__/`. |
| Expansion rules | `packages/core/src/extractor/bindings/expand.ts` + same tests. |
| Comment / literal blanking | `packages/core/src/extractor/shared/jslikeTextRanges.ts` (`importBindingScanBlankRanges`). |
| Call matching / patterns | `extractor/shared/calls.ts`, `extractor/shared/pattern.ts`. |
