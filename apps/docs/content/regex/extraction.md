# Translation call extraction

[← Back to regex overview](.)

## Function name pattern

Configured **`functions`** (e.g. `["t"]`) are turned into a regex alternation of **identifier-safe** names and matched with a **word boundary** so names like `toast` do not match `t`.

Implementation: `packages/cli/src/core/extractor/pattern.ts` (`buildFunctionsPattern`, `escapeRegex`).

## Call sites

`findTranslationCallSites` scans source for `name(` after a match, finds the closing `)`, and parses the **first argument** substring (`firstArgRaw`). It skips strings and comments while scanning so parentheses inside literals do not break pairing.

Implementation: `packages/cli/src/core/extractor/calls.ts`.

## First argument shapes

- **Quoted literal** — `'a.b'` / `"a.b"` → full static key.
- **Template literal** — `` `...` `` — passed to const substitution and/or keySites / dynamic analysis.

## Known gaps (indirection and wrappers)

These patterns often **do not** produce the same results as a typechecker-aware extractor:

| Pattern | Effect |
|---------|--------|
| `const fn = t` then `fn('key')` | Usually **missed** — the call site is `fn`, not `t`. |
| `obj.t('key')` | **Missed** — matching is for **bare** `name(` calls. |
| Re-exported or wrapped `t` | May match **only** where the identifier matches `functions`. |
| Dynamic import / `require()`-bound `t` | **Missed** or inconsistent. |
| Keys built only from runtime values | **Not** resolved to a static path; may surface as dynamic / partial only. |

## What we do not do (by design)

- No scope-aware binding across modules: only **call shapes** matching configured function names.
- No control-flow: dead branches still contribute observations unless the call is detected as inside a comment (keySites + dynamic comment ranges).

## Duplicate const identifiers across files

`validate`, **`missing`**, and now **`cleanup`** compute “keys in code” from **per-file** scans so each file gets its **own** `const` → string map for template substitution.

If you instead merge **all** source into one blob and build **one** map, the **last** `const NS = '…'` in that blob wins for **every** `` t(`&#36;{NS}.…`) `` in the project. That produces **false “missing” keys** (wrong dotted path) when two files reuse the same identifier (e.g. both `const NS = 'pages.dashboard.admin'` and `const NS = 'pages.dashboard.shortcuts'`). **This is not a bug in your JSON** — it was a limitation of merged-map resolution; per-file matching fixes it.

## Roadmap (possible hardening)

Future work could add an **optional** TypeScript/`vue-tsc`/`tsx` AST layer for alias resolution and richer call targets — **not** a promise in the current release; the regex pipeline remains the default for speed and zero compiler lock-in.
