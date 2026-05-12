# Runtime (same core, different hosts)

**`@i18nprune/core`** ships **deterministic engines**—missing-key detection, sync transforms, translation pipelines, JSON payloads—for CLI tools, CI scripts, browser tooling, and serverless workers. **Algorithms stay identical** across surfaces; what varies per **runtime** is **construction**: binding filesystem paths, clocks, and optional networking behind **`RuntimeAdapters`**.

---

## Why there are multiple runtime entries

JavaScript execution differs materially:

| Need | Node / CLI | Browser (`runtime/web`) | Worker / edge (`runtime/edge`) |
|------|------------|-------------------------|-------------------------------|
| Read/write local locale JSON | Yes — native **`fs`** adapters | No — no arbitrary repo **`fs`** | Usually restricted |
| **`node:`** imports (`fs`, `child_process`, …) | Allowed behind **`/runtime/node`** | Must stay **out** of the bundle graph | Must stay **out** |
| Long-running orchestration | Yes | Short-lived tab/session | Request-bound isolate |

Keeping adapters separate avoids accidentally leaking **`node:`** symbols into portable bundles while preserving **one** implementation for **`generate`**, **`validate`**, **`sync`**, and **`report`** payloads.

---

## Canonical imports

| Consumer | Import |
|----------|--------|
| Node / CLI | `import { … } from 'i18nprune/core/runtime/node'` |
| Browser | `import { … } from 'i18nprune/core/runtime/web'` |
| Worker / Edge | `import { … } from 'i18nprune/core/runtime/edge'` |
| Types only | `@i18nprune/core` (no adapter factories at root barrel) |

Source barrels live under **`packages/core/src/runtime/exports/{node,web,edge}.ts`**.

---

## Adapter contracts (`RuntimeAdapters`)

Constructed adapters expose **`filesystem`** / **`path`** / **`system`** / **`network`** slices suited to the host:

- **One coherent bundle per runtime graph** — the **`node`** graph may reference **`node:fs`**; **`web`** / **`edge`** graphs must remain **`node:`-clean**.
- **Capability discipline** — APIs typed as **`ProjectFilesystemRuntime`** must not reach into **`network`** unless explicitly allowed by types.

CLI resolves adapters via **`resolveContext()` → `ctx.adapters`** on commands that touch disk.

---

## Product tiers (what each host is usually asked to do)

| Tier | Typical hosts | Strong fits |
|------|---------------|-------------|
| **A — read / analyze** | Browser, Worker | **`validate`**, **`review`**, **`quality`**-style scans; interpreting **`report`** JSON already fetched elsewhere |
| **B — write** | CLI (Node), IDE extensions | **`generate`**, **`sync`**, **`cleanup`**, applying **`missing`** plans |
| **C — hybrid** | Web UI + backend you operate | Tier **B** executed server-side while Tier **A** runs client-side previews |

Exact bundles shipped under **`apps/web`** or **`apps/workers/*`** evolve independently—the separation guarantees **`core`** never forks semantics.

---

## Deep dives

- **[Node / CLI](node.md)** — Tier **B** reference host (`web.i18nprune.dev` marketing builds remain bundles-only unless intentionally invoking **`runtime/web`**).
- **[Browser (Web)](web.md)** — `runtime/web`, **`web.i18nprune.dev`** scenarios (analyze/demo tooling).
- **[Worker / edge](worker.md)** — `runtime/edge`, **`workers.i18nprune.dev`**, bundle auditing (`docs/madge/README.md` graph hygiene vs Workers-safe bundles).

---

## Verification mindset before publishing Worker bundles

- Confirm **`entry`** graphs exclude **`node:`** imports (automated grep fixtures recommended once pipelines stabilize).
- Run **`pnpm madge`** (see **`docs/madge/README.md`**) when refactoring **`packages/core/src/runtime/**`** so adapters remain layered cleanly.
