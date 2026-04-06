# `@zamdevio/i18nprune/config`

Type-safe configuration authoring for **i18nprune**.

## Purpose

This subpath provides `defineConfig` and full TypeScript types. Use it when writing `i18nprune.config.ts` (or `.mts`/`.js`) to get excellent editor support and validation.

## Usage

```ts
import { defineConfig } from '@zamdevio/i18nprune/config';
import type { I18nPruneConfig } from '@zamdevio/i18nprune/config';

export default defineConfig({
  source: 'locales/en.json',
  localesDir: 'locales',
  src: 'src',
  functions: ['t', 'i18n.t'],
  policies: {
    preserve: {
      'common.*': true,
    },
  },
});
```

## Exports

- `defineConfig(config: Partial<I18nPruneConfig>): I18nPruneConfig`
- Types: `I18nPruneConfig`, `Policies`, and all nested types

## See also

- [Main exports](../README.md)
- [Core API](./core.md)
- [Examples](./examples.md)
