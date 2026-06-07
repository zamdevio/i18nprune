---
description: "Run command-equivalent workflows directly in code with @i18nprune/core."
---

# SDK examples

Run command-equivalent workflows directly in code with `@i18nprune/core`.

These scripts in `examples/sdk/**` are the canonical starting point when you need:

- CI scripts without spawning a CLI process
- app/server integration with runtime adapters
- deterministic JSON/result handling from `runXxx` operations

## Example index

| Operation | Example script | Typical use |
|-----------|----------------|-------------|
| `doctor` | `examples/sdk/doctor/runDoctor.ts` | Environment/path readiness checks in scripts |
| `missing` | `examples/sdk/missing/runMissing.ts` | Missing key analysis inside custom tooling |
| `sync` | `examples/sdk/sync/runSync.ts` | Locale topology alignment from Node jobs |
| `review` | `examples/sdk/review/runReview.ts` | Drift/parity review automation |
| `quality` | `examples/sdk/quality/runQuality.ts` | Quality checks for CI and dashboards |
| `generate` | `examples/sdk/generate/runGenerate.ts` | Provider-backed translation flows |
| `translate` | `examples/sdk/translate/runTranslate.ts` | Translation-provider focused usage |
| `share list` | `examples/sdk/share/runShareList.ts` | Share cache introspection from scripts |

## Minimal host pattern (Node)

```ts
import { resolveContext, runSync } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

const ctx = await resolveContext({
  projectRoot: process.cwd(),
  adapters: createNodeRuntimeAdapters(),
});

const res = await runSync(ctx, { dryRun: true });
console.log(res);
```

## Notes for SDK consumers

- Runtime adapters are host-owned (`runtime/node`, `runtime/web`, `runtime/edge`).
- CLI-style human output is not required; consume typed results directly.
- The same issue-code contracts used by CLI `--json` are available in SDK results.
- For translation/share flows, keep secrets and cache directories under your host policy.

## Related docs

- [SDK operations](../sdk/operations.md)
- [Runtime overview](../runtime/README.md)
- [JSON output (`--json`)](../cli/json.md) for contract parity expectations
