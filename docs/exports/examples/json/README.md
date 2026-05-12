# Export Example: translation surface

Read locale JSON and list **logical translation paths** (legacy strings or structured `{ value, … }` terminals).

## Script

```ts
import { collectTranslationSurfaceLeaves, readJsonFile, resolveContext } from 'i18nprune/core';

const ctx = resolveContext();
const source = readJsonFile(ctx.paths.sourceLocale);
const leaves = collectTranslationSurfaceLeaves(source);
console.log({ count: leaves.length, sample: leaves.slice(0, 10) });
```

## Timing

```bash
time node ./scripts/json-example.mjs
```
