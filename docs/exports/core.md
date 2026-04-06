# `@zamdevio/i18nprune/core`

The **programmatic heart** of i18nprune — battle-tested primitives used by the CLI itself.

## When to use

Use this when building:
- Custom CI scripts
- Pre-commit hooks
- Bulk migration tools
- IDE extensions
- Internal devops tooling

## Core Functions

### Context

```ts
import { resolveContext, clearContextCache } from '@zamdevio/i18nprune/core';

const ctx = resolveContext();           // uses process.cwd()
const ctx2 = resolveContext('/path/to/project');

clearContextCache(); // for tests or long-running processes
```

### Key Extraction & Scanning

```ts
import { scanSources, exactLiteralKeys, scanProjectDynamicKeySites } from '@zamdevio/i18nprune/core';

const sourceText = scanSources(ctx.paths.srcRoot);
const literalKeys = exactLiteralKeys(sourceText, ctx.config.functions, new Map());

const dynamicSites = scanProjectDynamicKeySites(ctx);
```

### JSON Utilities

```ts
import { collectStringLeaves, readJsonFile } from '@zamdevio/i18nprune/core';

const sourceData = readJsonFile(ctx.paths.sourceLocale);
const allLeaves = collectStringLeaves(sourceData);
```

## Safety & Design

- Same resolution logic as the CLI (no drift)
- Pure functions where possible
- No side effects except `readJsonFile`
- Full TypeScript support

## See also

- [Main exports](../README.md)
- [Configuration](./config.md)
- [Usage Examples](./examples.md)
