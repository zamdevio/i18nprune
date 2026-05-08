# Export Example: validate

Compute missing keys with the same logic as `i18nprune validate`.

## Script

```ts
import { context, files, validate } from 'i18nprune/core';

const ctx = context.resolveContext();
const source = files.readJsonFile(ctx.paths.sourceLocale);
const missing = validate.computeMissingLiteralKeys(ctx, source);
console.log(missing);
```

## Output shaping

```bash
node ./scripts/validate-example.mjs | jq 'length'
```
