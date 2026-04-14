# Regex and static analysis in i18nprune

This section documents **pattern-based** and **heuristic** extraction used by the CLI and core. It is **not** a full JavaScript/TypeScript parser: behavior follows **regex + small state machines** and **string walks**, so edge cases exist.

## What we can and cannot claim

| Capability | Typical quality | Limits |
|------------|-----------------|--------|
| Finding `t('key')` / `` t(`tpl`) ``-style calls | Strong when call shape matches | Misses indirect calls (`const fn = t`), non-standard wrappers, keys built entirely at runtime |
| Resolving `` `${CONST}.rest` `` with a per-file `const` map | Strong when identifiers are simple | Misses computed or imported values not in the file map |
| Marking “dynamic” / non-literal first args | Good for surfacing risk | May over- or under-report vs. a real AST |
| Comment detection for calls | Good for `//` and `/* */` in JS/TS-like text | Not a full grammar; odd nesting can slip through |
| Ripgrep on locale **string values** | Finds literal text in `src/` | Proves **text reuse**, not that a **key path** is still wired |

## Detection limits

This toolkit is **not** a full JavaScript/TypeScript compiler. It uses **regex**, **balanced scans** for call arguments, and **per-file const maps**. Treat results as **high-signal when your code matches the expected call shapes**, and **conservative** when you rely on indirection.

**Typical blind spots** (details in linked pages):

- **Indirect translation functions** — e.g. `const fn = t` / aliasing: the matcher looks for **configured names** at call sites, not every binding of `t`.
- **Cross-file or runtime-only consts** — `constMap` is built from **text in the same file**; imported constants may not substitute in templates.
- **Merged / concatenated scans** — APIs that concatenate files may **omit per-file comment detection** (see [key-sites-and-dynamic](./key-sites-and-dynamic.md)).
- **Framework-specific syntax** — Vue Svelte etc. are scanned as text; script boundaries and macros can hide or duplicate calls.

For **cleanup / fill / sync**, the **`reference`** config and **uncertain prefixes** exist to reduce false removals; they do not guarantee every runtime path is enumerated.

## Pages

- [Translation call extraction](./extraction.md) — function-name pattern, first-argument parsing, known gaps.
- [Key sites vs dynamic detection](./key-sites-and-dynamic.md) — literals, templates, partials, dynamic sites, comments, merged-text caveats.
- [Ripgrep string presence](./ripgrep.md) — cleanup `guard` / `warn` / `off`, JSON hits, relationship to `reference` config.

## Related config

- **`policies.preserve` / `policies.parity`** — catalog copy and parity exclusions.
- **`reference`** — defaults and per-command overrides for uncertain prefixes, string presence (`rg`), `respectPreserve` for fill (see `packages/cli/src/config/schema.ts` and defaults).
