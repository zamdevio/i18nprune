# Export Example: extractor

Run literal key extraction without invoking the CLI binary.

## Script

```ts
import { context, extractor } from 'i18nprune/core';

const ctx = context.resolveContext();
const usage = extractor.scanProjectLiteralKeyUsage(ctx);
console.log({
  resolved: usage.resolvedKeys.size,
  unresolved: usage.unresolvedTemplates.length,
});
```

## Output shaping

```bash
node ./scripts/extractor-example.mjs | jq
```
