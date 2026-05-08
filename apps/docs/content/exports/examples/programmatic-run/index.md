# Export Example: programmatic run helpers

Run CLI-equivalent JSON envelopes from code.

## Script

```ts
import {
  tryResolveContext,
  runValidate,
  runSync,
  runReview,
  stringifyEnvelope,
} from 'i18nprune/core';

const ctx = tryResolveContext(process.cwd());
if (!ctx.ok) throw new Error('context failed');

console.log(stringifyEnvelope(runValidate(ctx.data), true));
console.log(stringifyEnvelope(runSync(ctx.data, { dryRun: true }), true));
console.log(stringifyEnvelope(runReview(ctx.data, { target: 'all' }), true));
```

## Timing

```bash
time node ./scripts/programmatic-run-example.mjs
```
