# Command namespaces in config

The root config object includes optional namespaces for commands that read file-backed defaults today.

**Related:** [Environment variables](./env.md) (canonical names in `packages/cli/src/constants/env.ts`). When **`i18nprune/core`** export surface changes, keep **`I18nPruneConfig`** / **`defineConfig`** aligned (`docs/exports/`, `packages/core/package.json` exports).

## Locale display metadata (not in `generate`)

English label, native endonym, and layout direction for app loaders live in **`src/i18n/config.json`** (via **`i18nprune patch`**), not in per-locale **`<lang>.meta.json`** sidecars. **`generate`** resolves display labels from the bundled language catalog for progress output only. See [Locale filesystem layouts](../locales/layouts.md) and [generate](../commands/generate/README.md).

## `missing`

- **Purpose:** defaults for **`i18nprune missing`** scaffold string.
- **Fields:**

| Field | Type | Effect |
|-------|------|--------|
| **`placeholder`** | string (optional) | Value written at each new key path. Omit → core **`DEFAULT_MISSING_LEAF_PLACEHOLDER`** (`__I18NPRUNE_MISSING__`). |

**Example:**

```ts
export default {
  source: 'locales/en.json',
  localesDir: 'locales',
  src: 'src',
  functions: ['t'],
  missing: { placeholder: '__I18NPRUNE_MISSING__' },
};
```

Use **`import { defineConfig, type I18nPruneConfig } from 'i18nprune/core/config'`** so **`defineConfig(...)`** merges **`missing`**, **`reference`**, etc. the same way as **`policies`**, and add **`satisfies Partial<I18nPruneConfig>`** for editor-time checks. The CLI loader still merges **`DEFAULT_CONFIG`** then **Zod**-parses the exported object.

**`i18nprune validate`** is controlled by **CLI flags and scanning rules** only — there is **no** separate **`config.validate`** namespace until a future release defines one and the command reads it.

## Environment variables (command-related)

Full reference: [Environment variables](./env.md) (includes **`CI`**, **`I18NPRUNE_*`**, **`I18NPRUNE_GENERATE_*`**). Global CLI flags (e.g. **`--yes`**, **`--json`**) are documented per command.
