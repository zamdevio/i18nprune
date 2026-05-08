# Export Example: result

Handle envelopes and issues in scripts without calling `process.exit`.

## Script

```ts
import { result, tryResolveContext, runValidate } from 'i18nprune/core';

const ctx = tryResolveContext(process.cwd());
if (!ctx.ok) {
  console.log(result.stringifyEnvelope(result.optionErrorEnvelope(ctx.issues), true));
  process.exit(1);
}
console.log(result.stringifyEnvelope(runValidate(ctx.data), true));
```
