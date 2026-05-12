# Export Example: programmatic run helpers

Run CLI-equivalent JSON envelopes from code.

## Script

```ts
import {
  tryResolveContext,
  runValidate,
  stringifyEnvelope,
} from 'i18nprune/core';

const ctx = tryResolveContext(process.cwd());
if (!ctx.ok) throw new Error('context failed');

console.log(stringifyEnvelope(runValidate(ctx.data), true));
```

For migrated core ops such as `sync`, `quality`, and `review`, use the op-specific SDK examples under `examples/sdk/` and wrap the returned `{ payload, issues }` in your host's own transport or envelope.

## Timing

```bash
time node ./scripts/programmatic-run-example.mjs
```
