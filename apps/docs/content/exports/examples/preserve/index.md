# Export Example: preserve

Check whether a key path is protected by preserve policy.

## Script

```ts
import { context, preserve } from 'i18nprune/core';

const ctx = context.resolveContext();
const keep = preserve.isPreservePath('auth.labels.logout', ctx.config.policies?.preserve);
console.log({ keep });
```
