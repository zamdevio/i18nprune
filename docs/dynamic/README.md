# Dynamic Keys — Best Practices & Patterns

This guide explains how **i18nprune** handles **dynamic (non-literal)** translation keys and provides recommended patterns to get the most accurate results from the tool.

## What are dynamic keys?

A "dynamic key" is any call to your translation function (`t`, `i18n.t`, etc.) where the first argument is **not** a static string literal:

```ts
// Static (good — fully validated)
t('hello.world')
t(`hello.${user.id}`) // treated as dynamic

// Dynamic (not validated as a literal key)
t(someVariable)
t(`hello.${name}`)
t(getKey())
```

The tool **cannot** know the final key at build time for these cases, so it reports them separately.

## Recommended Patterns

### 1. Minimize dynamic keys

**Strongly preferred:**

```ts
// Good
t('user.profile.title')
t('common.buttons.save')

// Avoid when possible
t(`user.${userId}.name`) // becomes dynamic
```

Use **static keys** whenever you can. This gives you full validation, better autocomplete, and fewer surprises.

### 2. Use one consistent translation function

Configure your main function in `i18nprune.config.ts`:

```ts
export default defineConfig({
  functions: ['t'],           // primary function
  // or multiple:
  // functions: ['t', 'i18n.t', '$t'],
});
```

**Tip:** Be consistent across your codebase. Using many different names increases the chance of missed keys.

### 3. Acceptable uses of dynamic keys

Dynamic keys are sometimes unavoidable:

- Internationalized routes: `t(\`route.\${slug}\`)`
- User-generated content keys
- Highly dynamic admin panels

In these cases the tool will warn you but will **not** treat them as missing keys.

## Why `constMap` makes this so effective

The tool builds a **per-file map** of `const Identifier = 'some string'` (see `packages/cli/src/core/constmap/build.ts`). That same map already feeds **`exactLiteralKeys`**: when you write `` t(`${NS}.foo`) `` and `const NS = 'app'` exists in the file, the **resolved** key is the string `app.foo`—a normal static key path.

**Dynamic detection** reuses that map. If every `` `${Name}` `` in the template can be replaced with a value from the map, the first argument is **no longer “unknown”** at analysis time: it is exactly the same kind of static key as `t('app.foo')`. Those calls are **not** reported as dynamic.

When **one** segment stays unknown (e.g. `` `${userId}` `` or a missing const), you still get a dynamic warning—but we can attach a **`resolvedPrefix`** (the dotted path **before** the first unresolved interpolation) so you see which namespace is still safe to reason about.

That combination—**full rebuild when possible**, **partial prefix when not**—is why projects with many namespace constants see a **sharp drop** in “dynamic” noise: most of those calls were never truly “dynamic”; they were **rebuildable static keys** hiding behind template syntax.

## How the tool handles dynamic keys

- **Extension-only sources** — Scans files under your configured `src` path whose extensions match the scanner (TypeScript/JavaScript-like, Vue, Svelte, etc.). We do **not** infer “source” from folder names; unsupported extensions are skipped.
- `validate` — warns about non-literal calls (per-file paths and lines when available)
- `locales dynamic` — lists detected sites with path and line
- `sync` — warns if dynamic sites exist (shape sync is unchanged)
- **Comments** — Calls that appear inside `//` or block comments are labeled **`commented`** (heuristic, not a full parser).
- **Partial prefix** — For templates that stay dynamic, **`resolvedPrefix`** may list the static path segment before the first unresolved `${…}` (when it looks like a dotted key path).
- **Call-bounded preview** — Previews are generated from the exact matched call span (`t(...)`), not a fixed-size slice from source offset, to avoid leaking neighboring tokens.
- **Multiline awareness** — Sites include **`isMultilineCall`** when the matched call spans multiple lines.

## Configuration Tips

```ts
// Best config for most projects
export default defineConfig({
  functions: ['t'],
  src: 'src',
  // ... other options
});
```

## Future Improvements

- Optional **const aliases** (e.g. imported key registries) when we can resolve them safely from config or static analysis.
- **String-array** + loop patterns for used-key / cleanup alignment.
- More **language providers** (Python, Go, …) behind the same extension-based router.
- Optional **ripgrep** cross-check for CI.

---

**Related:**
- [Core API](../exports/core.md) — `scanProjectDynamicKeySites()`
- [Commands](../commands/locales/dynamic/README.md) — `i18nprune locales dynamic`

See `docs/agents/analysis.md` for architecture details.
