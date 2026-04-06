# Programmatic Usage Examples

Real-world recipes using `@zamdevio/i18nprune/config` and `@zamdevio/i18nprune/core`.

## 1. Pre-commit Validation Hook

```ts
// scripts/validate-i18n.ts
import { resolveContext, scanProjectDynamicKeySites } from '@zamdevio/i18nprune/core';
import { exactLiteralKeys } from '@zamdevio/i18nprune/core';

const ctx = resolveContext();
const dynamicSites = scanProjectDynamicKeySites(ctx);

if (dynamicSites.length > 0) {
  console.warn(`${dynamicSites.length} dynamic translation keys found.`);
  process.exit(1);
}
```

## 2. Custom Report Generator

```ts
import { resolveContext, collectStringLeaves, scanSources } from '@zamdevio/i18nprune/core';

const ctx = resolveContext();
const sourceData = readJsonFile(ctx.paths.sourceLocale);
const usedKeys = new Set(exactLiteralKeys(scanSources(ctx.paths.srcRoot), ctx.config.functions));

const unused = Object.keys(collectStringLeaves(sourceData))
  .filter(k => !usedKeys.has(k));

console.log('Unused keys:', unused);
```

## 3. Config in Library / Monorepo

```ts
import { defineConfig } from '@zamdevio/i18nprune/config';

export default defineConfig({
  source: 'packages/design-system/locales/en.json',
  localesDir: 'packages/design-system/locales',
  src: 'packages/**/*.{ts,tsx}',
  functions: ['t'],
});
```

## 4. Testing Context Resolution

```ts
import { resolveContext, clearContextCache } from '@zamdevio/i18nprune/core';

test('resolves context correctly', () => {
  clearContextCache();
  const ctx = resolveContext(fixturePath);
  expect(ctx.meta.fieldSources.source).toBe('file');
});
```

---

More examples coming as the ecosystem grows.

**Pro tip:** Always call `clearContextCache()` in tests or when switching projects.
