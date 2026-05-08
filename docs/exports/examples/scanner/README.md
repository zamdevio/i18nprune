# Export Example: scanner

Read merged source text from the configured `src` tree.

## Script

```ts
import { context, scanner } from 'i18nprune/core';

const ctx = context.resolveContext();
const text = scanner.scanSources(ctx.paths.srcRoot);
console.log({ bytes: text.length });
```

## Timing

```bash
time node ./scripts/scanner-example.mjs
```
