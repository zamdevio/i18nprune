# Export Example: files

Use file helpers shared by CLI and library scripts.

## Script

```ts
import { context, files } from 'i18nprune/core';

const ctx = context.resolveContext();
const source = files.readJsonFile(ctx.paths.sourceLocale);
console.log(Object.keys(source));
```

## Output shaping

```bash
node ./scripts/files-example.mjs | jq '.[0:10]'
```
