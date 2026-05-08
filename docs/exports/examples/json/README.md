# Export Example: json

Read locale JSON and flatten string leaves for custom analysis.

## Script

```ts
import { context, files, json } from 'i18nprune/core';

const ctx = context.resolveContext();
const source = files.readJsonFile(ctx.paths.sourceLocale);
const leaves = json.collectStringLeaves(source);
console.log({ count: leaves.length, sample: leaves.slice(0, 10) });
```

## Timing

```bash
time node ./scripts/json-example.mjs
```
