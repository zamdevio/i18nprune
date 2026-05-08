# Export Example: context

Resolve context once and reuse paths/config across scripts.

## Script

```ts
import { context } from 'i18nprune/core';

const ctx = context.resolveContext(process.cwd());
console.log({
  source: ctx.paths.sourceLocale,
  localesDir: ctx.paths.localesDir,
  srcRoot: ctx.paths.srcRoot,
});
```

## Timing

```bash
time node ./scripts/context-example.mjs
```
