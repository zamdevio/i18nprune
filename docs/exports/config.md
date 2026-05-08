# `i18nprune/core/config`

Type-safe **project config** authoring for **`i18nprune.config.*`** (same **`defineConfig`** the **`i18nprune init`** scaffold uses).

## Purpose

This subpath exposes **`defineConfig`** (merges partial input with CLI defaults) and **`I18nPruneConfig`**. Use **`satisfies Partial<I18nPruneConfig>`** on the object literal so TypeScript checks keys and nested shapes in the editor. The CLI still merges **`DEFAULT_CONFIG`** and **Zod**-parses after import, so runtime validation always matches the published schema.

## Usage

```ts
import { defineConfig, type I18nPruneConfig } from 'i18nprune/core/config';

export default defineConfig({
  source: 'locales/en.json',
  localesDir: 'locales',
  src: 'src',
  functions: ['t', 'i18n.t'],
  policies: {
    preserve: {},
    parity: {},
  },
} satisfies Partial<I18nPruneConfig>);
```

## Exports

- **`defineConfig(config: Partial<I18nPruneConfig>): I18nPruneConfig`**
- **`type I18nPruneConfig`** (and re-exported nested types reachable from that module’s **`.d.ts`** bundle)

## See also

- [Main exports](../README.md)
- [Core API](./core.md) — **`i18nprune/core`** for runtime engine APIs (extractor, translator, …)
- [Examples](./examples.md)
- [Configuration](../config/README.md)
