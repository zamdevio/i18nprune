# Extractor (JavaScript / TypeScript–like sources)

This page explains how **i18nprune** discovers translation helpers and keys in JavaScript, TypeScript, and JS-like single-file formats (for example `.vue`, `.svelte`). It sits alongside command references under `docs/commands/` (for example **validate** and **locales dynamic**).

For known gaps and tradeoffs, see **[Unsolved edge cases](../edge-cases/unsolved/inventory.md)**.

---

## How detection works (overview)

- **Pattern-based, not a full language parser:** the tool favors predictable behavior and clear limits over trying to understand every possible program shape.
- **Three ideas working together:**
  1. **Import bindings** — figures out which local names (for example `t`, `tr`, `i18n.t`) refer to your configured helpers.
  2. **Simple constant maps** — when string prefixes come from straightforward `const` values, template keys can sometimes be resolved to concrete paths.
  3. **Call-site analysis** — finds helper calls and classifies literal keys, template keys, and non-literal (“dynamic”) usages.

---

## Three layers at a glance

| Layer | What it does for you |
| :--- | :--- |
| **Bindings** | Reads import and require patterns in each file and **extends** your configured `functions` list with aliases and object-style calls (for example `i18n.t`). |
| **Const map** | Uses obvious `const` string assignments to help rebuild template-style keys when the prefix is known. |
| **Templates and dynamic keys** | Rebuilds some `` `${prefix}.key` ``-style templates when safe; otherwise records **dynamic** sites so commands can report them honestly. |

---

## What happens per file (conceptual)

For each source file, i18nprune roughly:

1. Reads the file text.
2. Resolves **imports / requires** and builds the **effective** set of helper names to look for (your config plus discovered aliases).
3. Scans for **calls** to those helpers.
4. Feeds results into **literal / template key** reporting and **dynamic key** reporting, depending on which command you run.

The sections below spell out binding shapes, how `functions` expansion behaves, and known limits.

---

## 1. Import binding scan

**Input:** the full file text.  
**Output:** a normalized list of bindings (named imports, default/namespace modules, CommonJS patterns, and supported dynamic `import()` forms).

### Binding shapes (conceptual)

- **Named bindings** — for example `import { t as tr } from '…'`, `const { t } = require('…')`, `const { t } = await import('…')`. Each has an imported name, the local name in the file, and where it came from (ESM, `require`, `await import`, or TypeScript import-assign).
- **Module bindings** — for example `import i18n from '…'`, `import * as i18n`, `const i18n = require('…')`, `import i18n = require('…')`, `import { default as i18n } from '…'`. These are the object you call methods on (`i18n.t`, and similar).

Type-only imports are recognized and **ignored** for runtime expansion (they do not add callable names).

### Identifiers

Matching allows Unicode identifiers where JavaScript does, so names like `$t` or non-ASCII identifiers can match when they are valid in the language.

### Noise reduction before matching imports

Before running import-style regular expressions, the scanner **blanks** (replaces with spaces):

1. **Line and block comments** — full comment spans, in a string-aware way so strings are not broken.
2. **String and template interiors** — only the **inside** of quoted regions, leaving quotes in place so paths like `from './module'` still match. Template bodies are treated as one interior (including `` `${ ... }` `` text).

This cuts false positives; it is not a guarantee of perfect parsing inside every exotic embedding.

### Supported import-style patterns (high level)

| Category | Examples |
| :--- | :--- |
| ESM | `import { t }`, `import { t as tr }`, `import i18n`, `import * as i18n`, `import i18n, { t }`, `import { default as i18n }` |
| Type-only | `import type { … }`, `import type * as …`, `import type Foo from` — recorded but not used as runtime callables |
| TypeScript | `import i18n = require('…')` |
| CommonJS | `const { t } = require('…')`, `const { t: tr } = require('…')`, `const i18n = require('…')` |
| Dynamic import | `const { t } = await import('…')`, `const i18n = import('…')` |

**Not supported today:** non-literal `require` / `import()` targets, destructuring helpers from arbitrary runtime values (`const { t } = i18n` without a matching import pattern in the same file), or relying on re-exports / barrel files **without** a direct import in the file being analyzed.

---

## 2. Expanding `functions` from config

**Input:** your configured `functions: string[]` plus the bindings from the previous section.  
**Output:** an ordered list: every name you configured, preserved, then **extra** discovered names (sorted for stability).

### Named aliases

If a **named** binding’s imported or local name appears in `functions`, the **local** name used in the file is included so calls like `tr('…')` match.

### Module members

For each **method suffix** built from:

- every configured **simple** name (no `.`), and  
- every **named** binding whose imported or local name intersects `functions` (so a local alias can still imply the canonical `…t` member on a module object),

…the tool adds, on each **module** binding’s local object name:

- `obj.method`, `obj?.method`
- when safe, quoted forms such as `obj['method']` and `obj["method"]` (and optional-chaining variants)

---

## 3. Call sites and keys

After expansion, call-site detection uses the **effective** function name list. How literals, templates, commented-out code, and dynamic keys surface in **reports and JSON** depends on the command; see **validate** and **locales dynamic** in `docs/commands/`.

---

## Best practices (clearer projects, fewer surprises)

- Prefer **string literals** (or simple templates the tool can tie back to constants) for keys when you want strong **validate** coverage.
- Use **direct imports** in the same file that calls the helper. Barrel-only or re-export-only setups are easy for humans to follow but harder for static pattern matching.
- List the **canonical helper names** you care about in `functions`; the tool adds plausible aliases and `object.method` forms from bindings.
- For **framework hooks** (for example destructuring from `useTranslation()`), detection may be incomplete until first-class support exists. A small wrapper module that exports a stable `t` can improve results today. Details are tracked under [Unsolved edge cases](../edge-cases/unsolved/inventory.md).

---

## Known limits (honest checklist)

| Limit | What it means in practice |
| :--- | :--- |
| No full dataflow | Patterns like `const x = t` or passing `t` into another function are not traced. |
| Prose-like first arguments | Some calls whose first argument looks like ordinary prose may be skipped to avoid false positives; edge cases are listed in the [inventory](../edge-cases/unsolved/inventory.md). |
| Regex-based import parsing | Very unusual import syntax or deeply nested braces in import lists can be missed or misread. |
| Imports inside template holes | An import written only inside a template `${ … }` region is treated like part of the template body, not as a top-level import line. |
| Commented literal calls | A commented-out line like `// t('key')` is **not** reported as a **dynamic** site the same way a live non-literal call would be. |
| Hooks and framework magic | Destructuring helpers from hook return values may need explicit configuration or future work; see the [inventory](../edge-cases/unsolved/inventory.md). |

---

## Contributing

Improvements to detection live in the open-source **core** package in this repository. If you are changing behavior, run **`pnpm typecheck`** and **`pnpm test`** before submitting changes; contributor-oriented maps live under `maintainer/` in the repo (not published on the public docs site).
