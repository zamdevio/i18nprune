# Export Example: reference

Build and resolve reference-policy context for cleanup workflows.

## Script

```ts
import { context, reference } from 'i18nprune/core';

const ctx = context.resolveContext();
const eff = reference.resolveReferenceConfig('cleanup', ctx.config);
const refCtx = reference.buildKeyReferenceContext(ctx, eff);
console.log({ keys: refCtx.provenKeys.size, eff });
```
