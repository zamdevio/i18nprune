# Node / CLI runtime

**Import:** `i18nprune/core/runtime/node`

This surface backs the **`i18nprune`** CLI, IDE extensions running on Node, and any automation scripts executed locally or in CI containers.

## Why Node is the baseline host

| Capability | Meaning |
|------------|---------|
| **Filesystem** | Project-aware **`fs`** + **`path`** bindings (`RuntimeAdapters.filesystem`) mirror POSIX semantics consumers expect from CLI tooling |
| **`node:` modules** | Allowed because Node bundles explicitly load **`i18nprune/core/runtime/node`** |
| **Tier B operations** | **`generate`**, **`fill`**, **`sync`**, **`cleanup`**, **`missing`**, **`patch`** flows assume durable disk writes |

Anything labeled “same behavior as CLI” should resolve adapters through this entry before comparing outputs against browsers or Workers.

## Relationship to `packages/cli`

`packages/cli` handles Commander parsing, prompts, logging, TTY progress, and **`--json` envelopes**. Those orchestrators call **`core`** engines constructed with **`runtime/node`** adapters so filesystem mutations remain deterministic.

## When editing runtime code

1. Keep **`node:` imports** confined to **`packages/core/src/runtime/**`** files exported exclusively via **`runtime/node`**.
2. Mirror portable helpers under **`runtime/web`** / **`runtime/edge`** when browsers/workers need parity.
3. Prefer **`ctx.adapters`** from **`resolveContext()`** instead of ad hoc **`fs`** imports inside command helpers—future refactors depend on that boundary.

See [`README.md`](./README.md) for cross-runtime strategy and [`web.md`](./web.md) / [`worker.md`](./worker.md) for lighter hosts.
