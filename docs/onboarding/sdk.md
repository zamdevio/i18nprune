# SDK onboarding path

## When to use the SDK (vs the CLI)
Use the SDK when you want programmatic control from your own code, CI scripts, Workers, or a custom host.

Use the CLI when you mainly want a straightforward day-to-day workflow and human-friendly output.

The SDK engine is runtime-agnostic: core behavior stays consistent, while runtime adapters decide how each host provides filesystem, path, and environment capabilities.

## Install
Install the standalone engine:

```bash
npm i @i18nprune/core
```

## Quickstart: resolve context + scan usage
The core SDK is deterministic: you build a context for a project and run the same analysis routines the CLI relies on.

```ts
import { resolveContext, scanProjectLiteralKeyUsage } from '@i18nprune/core';

const ctx = resolveContext(); // uses the current working directory
const usage = scanProjectLiteralKeyUsage(ctx);
console.log(usage.resolvedKeys.size);
```

## Runtime adapters (Node, Web, Edge)
The currently documented runtime families are:
- Node
- Web
- Edge

What varies by host is adapter construction and environment constraints. See:
- [Runtime overview](../runtime/)
- [Node / CLI runtime](../runtime/node.md)
- [Browser (Web) runtime](../runtime/web.md)
- [Worker / edge runtime](../runtime/worker.md)

## Start from runnable SDK examples
Before writing your own integration, run and adapt the scripts in `examples/sdk/**`.

Those examples are the fastest path to understand context creation, run-entry usage, and host wiring patterns.

## Operations index
For the high-level “what do I run?” entry points, start from the CLI command catalog:
- [Commands](../commands/README.md)

Then use SDK-focused docs:
- [SDK operations](../sdk/operations.md)
- [Core API](../exports/core.md)

## What to read next
- [Examples hub](../examples/README.md)
- [Configuration API](../exports/config.md)
- [Locales config](../config/locales.md)
- [SDK operations](../sdk/operations.md)
- [JSON output (`--json`)](../cli/json.md)
