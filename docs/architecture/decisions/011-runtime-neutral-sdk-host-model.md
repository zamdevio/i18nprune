---
description: ADR 011 — runtime-neutral core with host adapters for Node, web, and edge filesystem/env bindings.
---

# ADR 011 — Runtime-neutral SDK host model

**Status:** Accepted  
**Date:** 2026-05-09  
**Deciders:** Abdisamed Mohamed  
**Related ADRs:** [ADR 006](./006-command-orchestrator-boundary.md), [ADR 009](./009-share-hosted-snapshot-contract.md)

## Context

The same engines (`validate`, `sync`, `generate`, `report`, share prepare) must run in **Node CLI**, **browser bundles**, and **worker isolates** without forking semantics. Node-only imports (`node:fs`, `child_process`) must not leak into portable graphs.

## Decision

1. **`@i18nprune/core` algorithms are runtime-neutral** — no `console.*`; no `process.*` except via passed `env` / adapters.
2. **Adapters per graph:** import `i18nprune/core/runtime/node`, `runtime/web`, or `runtime/edge` — each exports a coherent `RuntimeAdapters` bundle (`filesystem`, `path`, `system`, `network`).
3. **CLI resolves** adapters through `resolveContext()` → `ctx.adapters` for disk-touching commands.
4. **Capability tiers:** Tier A (read/analyze) fits browser/worker; Tier B (write locales, cleanup) expects Node or a backend you operate; product apps may combine both.
5. **`@i18nprune/ui` is separate** — runtime-cluster UI only (`apps/web`, `apps/report`, worker `/docs` shell); no imports from `@i18nprune/core` or share/report domain code in the UI package.

## Implementation

```typescript
import { resolveContext } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from 'i18nprune/core/runtime/node';

const ctx = await resolveContext({
  projectRoot: process.cwd(),
  adapters: createNodeRuntimeAdapters(),
});
```

Public examples use **`@i18nprune/core`** for programmatic entry points; the published CLI tarball also exposes `i18nprune/core` re-exports for config helpers.

## Consequences

### Positive

- One implementation for CI scripts, CLI, and hosted prepare paths.
- Bundle graphs stay `node:`-clean on web/edge.

### Negative

- Host authors must supply adapters instead of assuming `fs` globals.
- Not every command is meaningful in browser (no arbitrary repo `fs`).

### Mitigation

- [Runtime overview](../../runtime/README.md) and per-host pages ([node](../../runtime/node.md), [web](../../runtime/web.md), [worker](../../runtime/worker.md)).
- [SDK operations](../../sdk/operations.md) for `runXxx` entry points.

## Alternatives Considered

### Separate core forks per runtime

- **Pros:** Smaller per-bundle surface.
- **Cons:** Semantic drift; rejected early in runtime export work.

### CLI-only product (no SDK barrels)

- **Pros:** Narrower scope.
- **Cons:** Blocks IDE, worker upload, and init template SDK wording goals.

## References

- [Runtime overview](../../runtime/README.md)
- [SDK operations](../../sdk/operations.md)
- [ADR 006](./006-command-orchestrator-boundary.md)
- Git: `packages/core/src/runtime/exports/`; platform CI (`bbb96f7`, `a5395e7`)
