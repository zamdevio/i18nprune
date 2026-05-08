# Browser (Web) runtime

**Import:** `i18nprune/core/runtime/web`

Use **`runtime/web`** whenever **`@i18nprune/core`** executes inside a browser bundle—marketing explorers (`apps/web`), embedded playgrounds, or any SPA tooling where **`window`** exists but **`node:fs`** does **not**.

## What changes versus Node?

| Aspect | Browser expectation |
|--------|---------------------|
| **Filesystem** | No synchronous reads/writes of arbitrary repo paths; adapters expose **`filesystem`** behaviors tuned for **`fetch`**/IndexedDB/virtual FS layers |
| **Bundle hygiene** | **Must exclude every `node:` specifier** from reachable graphs |
| **Security model** | User-supplied projects arrive via uploads/API—not canonical POSIX paths |

## Typical workloads

- Tier **A** flows (`README.md`): validating pasted manifests, parsing **`report --json`** blobs fetched separately, surfacing parity dashboards client-side.
- Thin wrappers—heavy **`generate`/`sync`** orchestration generally stays Node-hosted unless you pair **`runtime/web`** analysis UI with a remote Tier **C** backend.

## First-party deployment sketch

The **`apps/web`** stack illustrates packaging **`runtime/web`** for **`web.i18nprune.dev`**. Follow upstream **`vite`/SSR constraints**, polyfills policies, and feature detectors documented alongside those builds whenever exposing **`core`** in-browser.

## Guidance checklist

1. Resolve adapters via **`createWebRuntime(...)`** (see **`packages/core/src/runtime`**) rather than copying globals manually.
2. Gate Tier **B** features explicitly—the UX copy must clarify actions executing remotely versus purely offline previews.
3. Pair bundle audits (`pnpm build --analyze`, Workers lint rules) with **`docs/madge/README.md`** guidance whenever **`runtime/web`** imports broaden.

See [`README.md`](.) for runtime comparisons and [`node.md`](./node.md) / [`worker.md`](./worker.md) for sibling hosts.
