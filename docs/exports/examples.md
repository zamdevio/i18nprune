# Programmatic Usage Examples

Real-world recipes using `i18nprune/core` and `i18nprune/core`.

## 1. Pre-commit Validation Hook

```ts
// scripts/validate-i18n.ts
import { resolveContext, scanProjectDynamicKeySites } from 'i18nprune/core';
import { exactLiteralKeys } from 'i18nprune/core';

const ctx = resolveContext();
const dynamicSites = scanProjectDynamicKeySites(ctx);

if (dynamicSites.length > 0) {
  console.warn(`${dynamicSites.length} dynamic translation keys found.`);
  process.exit(1);
}
```

## 2. Custom Report Generator

```ts
import {
  resolveContext,
  collectTranslationSurfaceLeaves,
  scanSources,
  readJsonFile,
  exactLiteralKeys,
} from 'i18nprune/core';

const ctx = resolveContext();
const sourceData = readJsonFile(ctx.paths.sourceLocale);
const usedKeys = new Set(exactLiteralKeys(scanSources(ctx.paths.srcRoot), ctx.config.functions));

const unused = collectTranslationSurfaceLeaves(sourceData)
  .map((l) => l.path)
  .filter((k) => !usedKeys.has(k));

console.log('Unused keys:', unused);
```

## 3. Config in Library / Monorepo

```ts
import { defineConfig, type I18nPruneConfig } from 'i18nprune/core/config';

export default defineConfig({
  source: 'en',
  localesDir: 'packages/design-system/locales',
  src: 'packages/**/*.{ts,tsx}',
  functions: ['t'],
} satisfies Partial<I18nPruneConfig>);
```

## 4. Testing Context Resolution

```ts
import { resolveContext, clearContextCache } from 'i18nprune/core';

test('resolves context correctly', () => {
  clearContextCache();
  const ctx = resolveContext(fixturePath);
  expect(ctx.meta.fieldSources.source).toBe('file');
});
```

## 5. Namespaced imports (same API, grouped)

```ts
import { context, extractor, dynamic, validate, files } from 'i18nprune/core';

const ctx = context.resolveContext();
const usage = extractor.scanProjectLiteralKeyUsage(ctx);
const sites = dynamic.scanProjectDynamicKeySites(ctx);
const raw = files.readJsonFile(ctx.paths.sourceLocale);
const missing = validate.computeMissingLiteralKeys(ctx, raw);
```

---

More examples coming as the ecosystem grows.

**Pro tip:** Always call `clearContextCache()` in tests or when switching projects.
