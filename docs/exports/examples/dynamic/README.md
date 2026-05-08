# Export Example: dynamic

Inspect dynamic translation call sites for triage.

## Script

```ts
import { context, dynamic } from 'i18nprune/core';

const ctx = context.resolveContext();
const sites = dynamic.scanProjectDynamicKeySites(ctx);
console.log(sites.slice(0, 20));
```

## Output shaping

```bash
node ./scripts/dynamic-example.mjs | jq '.[] | {file, line, raw, resolvedPrefix}'
```
