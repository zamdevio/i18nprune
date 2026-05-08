# Worker / edge runtime

**Import:** `i18nprune/core/runtime/edge`

Workers (Cloudflare Workers, AWS Lambda@Edge-style isolates, Deno Deploy, etc.) impose **strict bundle limits**, **no persistent POSIX filesystem**, and **no `node:` modules** unless explicitly polyfilled by the platform.

## Why `runtime/edge` exists

| Constraint | Impact |
|------------|--------|
| **Bundle graph audits** | Publishable graphs must tree-shake cleanly—accidentally importing **`runtime/node`** pulls forbidden **`node:`** symbols |
| **Filesystem semantics** | Reads/writes flow through virtual adapters (`KV`, `R2`, ephemeral `/tmp`, HTTP uploads) rather than raw **`fs.readFileSync`** |
| **Lifetime** | Runs last milliseconds—progress UX differs from CLI |

This package targets Tier **A** workloads first (`README.md`): **`validate`**, **`review`**, **`quality`**, **`report`** ingestion where payloads arrive via HTTP rather than disk scans.

## Hosting **`workers.i18nprune.dev`**

The **`apps/workers/*`** packages demonstrate packaging **`runtime/edge`** for Cloudflare Workers. Expect:

- **`wrangler`** compatibility layers for **`fetch`** / **`Request`** APIs.
- Explicit separation between **analysis-only** routes vs mutation routes that intentionally proxy Tier **B** work back to trusted Node infrastructure.

## Bundle checklist

1. Run **`pnpm`** builds with **`NODE_OPTIONS=--conditions worker`** (or host-specific presets) when applicable.
2. Add CI **`grep`** guards rejecting **`node:`** imports on Worker graphs once finalized (tracked alongside **`docs/madge/README.md`** hygiene).

See [`README.md`](./README.md) for tier comparisons and [`node.md`](./node.md) / [`web.md`](./web.md) for sibling adapters.
