# Programmatic exports (`@zamdevio/i18nprune`)

The npm package exposes **two subpath entrypoints** besides the default CLI binary. Use them to **reuse the same logic as the CLI** in scripts, CI, custom tools, or IDE extensions—without spawning a subprocess.

| Subpath | Purpose |
|---------|---------|
| **`@zamdevio/i18nprune/config`** | Type-safe config authoring — `defineConfig` + types only. |
| **`@zamdevio/i18nprune/core`** | Resolve project context, scan sources, extract keys, inspect JSON leaves, dynamic-key heuristics. |

The CLI (`i18nprune`) is the default export **`"."`** → `./dist/cli.js` (not imported as a library).

---

## `@zamdevio/i18nprune/config`

**Use when:** writing or validating `i18nprune.config.ts` / `.mts` / `.js` with full TypeScript assistance.

```ts
import { defineConfig } from '@zamdevio/i18nprune/config';
import type { I18nPruneConfig, Policies } from '@zamdevio/i18nprune/config';

export default defineConfig({
  source: 'locales/en.json',
  localesDir: 'locales',
  src: 'src',
  functions: ['t'],
  policies: { preserve: {}, parity: {} },
});
```

**Exports:** `defineConfig`, types `I18nPruneConfig`, `Policies`.

**Does not:** load the filesystem, run scans, or resolve discovery—those happen at runtime when the CLI (or **`core`**) runs with a working directory and optional overrides.

---

## `@zamdevio/i18nprune/core`

**Use when:** building automation that needs **resolved paths**, **literal keys**, **dynamic-key sites**, or **JSON leaf enumeration** aligned with **`validate`**.

### `resolveContext` / `clearContextCache`

- **`resolveContext(cwd?)`** — Builds **`Context`**: merged `config`, absolute **`paths`** (`sourceLocale`, `localesDir`, `srcRoot`), default **`run`** flags, and **`meta`** (field provenance, warnings). Merge order matches the CLI: defaults → config file → env → discovery → global CLI overrides (when set through the same mechanisms the CLI uses).
- **`clearContextCache()`** — Clears cached resolution between tests or long-lived processes.

### Extraction & scanning

- **`scanSources(srcRoot)`** — Concatenates scanned project source text (same pipeline as the CLI scanner).
- **`exactLiteralKeys(text, functions, constMap)`** — Literal translation keys from merged source text.
- **`findDynamicKeySites`**, **`analyzeDynamicKeysFromSourceText`**, **`scanProjectDynamicKeySites`** — Non-literal translation call heuristics (same as **`validate`** / **`locales dynamic`**).

### JSON

- **`collectStringLeaves(root)`** — String leaves with dot/bracket paths (for parity, diff tooling).
- **`readJsonFile(path)`** — Read JSON from disk (shared helper).

### Types

`Context`, `ResolvedPaths`, `I18nPruneConfig`, `DynamicKeySite`, `Policies`.

---

## What is *not* exported (by design)

- **Command orchestration** (`generate`, `fill`, `cleanup` writes) stays in the CLI layer—call **`i18nprune`** or import internal paths only from a fork (not supported semver).
- **Translator providers** are not a stable public API yet; extend via CLI or future explicit exports.
- **Logger / UI** — not part of **`core`**; keep scripts machine-readable.

---

## Versioning

Follow **semver** for the package. Treat **`core`** and **`config`** as **stable** once documented; breaking changes require a **major** bump. The CLI UX and default flags may evolve with minors/patches as long as **`core`** contracts stay compatible.

---

## See also

- [Config](../config/README.md) — file formats and merge order
- [CLI overview](../cli/README.md) — global flags that influence `resolveContext` when using the CLI
- [Architecture](../architecture/README.md)
