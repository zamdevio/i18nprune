<div align="center">
  <img src="https://i18nprune.dev/i18nprune.svg" width="72" height="72" alt="i18nprune logo" />

  <h1>@i18nprune/core</h1>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/zamdevio/i18nprune/blob/main/LICENSE)
  [![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![npm](https://img.shields.io/npm/v/@i18nprune/core?label=npm)](https://www.npmjs.com/package/@i18nprune/core)

  <p><strong>Validate · sync · generate · review · quality · cleanup · doctor · report · share</strong></p>
  <p>
    Runtime-neutral domain engine for <a href="https://i18nprune.dev">i18nprune</a> — same behavior as the CLI, without shelling out.
  </p>
  <p>
    <a href="https://docs.i18nprune.dev">Documentation</a> ·
    <a href="#quick-start">Quick start</a> ·
    <a href="#subpath-exports">Subpaths</a> ·
    <a href="https://www.npmjs.com/package/i18nprune">CLI package</a>
  </p>
</div>

---

Pure TypeScript engine for locale validation, sync, translation, diagnostics, and hosted share/report workflows. **No `console.*` and no direct `process.*` in core** — your host passes **runtime adapters** and an **env** object so the same logic runs in Node scripts, CI, browsers, and edge workers.

## Install

Requires **Node.js >= 18**.

```bash
npm install @i18nprune/core
# or: pnpm add @i18nprune/core
# or: yarn add @i18nprune/core
```

## Quick start

```ts
import { resolveContext, runSync } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

const ctx = await resolveContext({
  projectRoot: process.cwd(),
  adapters: createNodeRuntimeAdapters(),
});

const result = await runSync(
  ctx,
  { dryRun: true },
  { onProgress: () => {} },
);

console.log(result.summary);
```

Use **`defineConfig`** / **`loadConfig`** from `@i18nprune/core/config` when you want the same `i18nprune.config.ts` contract as the CLI.

## Why embed the SDK

| Benefit | What you get |
|--------|----------------|
| **Same engine as CLI** | `runValidate`, `runSync`, `runGenerate`, … share issue codes and cache rules with `i18nprune --json`. |
| **Host-owned UX** | Progress, logging, and exit policy stay in your app; core returns structured results. |
| **Runtime choice** | Node, browser (`runtime/web`), or edge (`runtime/edge`) adapter factories — one implementation graph per surface. |
| **Granular imports** | Subpath exports keep bundles small (`/validate`, `/sync`, `/generate`, …). |
| **Advanced integrations** | Cache, share upload prep, report ingest validation, and translation providers without subprocess overhead. |

Cross-platform behavior matches the CLI: Linux, macOS, and Windows path and cache semantics are parity-tested in the monorepo.

## Subpath exports

Published **`exports`** (see `package.json`):

| Subpath | Typical use |
|---------|----------------|
| `@i18nprune/core` | Root barrel: `runXxx`, `resolveContext`, namespaces (`validate`, `sync`, `translator`, …). |
| `@i18nprune/core/config` | `defineConfig`, schema, path resolution. |
| `@i18nprune/core/validate` | Validation-only graph. |
| `@i18nprune/core/sync` | Locale shape sync / prune. |
| `@i18nprune/core/generate` | Provider translation runs. |
| `@i18nprune/core/missing` | Missing-key workflows. |
| `@i18nprune/core/quality` | Quality checks. |
| `@i18nprune/core/cleanup` | Cleanup operations. |
| `@i18nprune/core/init` | Project bootstrap helpers. |
| `@i18nprune/core/locales` | Locale layout and listing helpers. |
| `@i18nprune/core/shared` | Shared primitives (JSON, scanner, constants, run helpers) — namespaced + flat re-exports. |
| `@i18nprune/core/types` | Public type barrels. |
| `@i18nprune/core/report-schema` | `ProjectReportDocument` Zod schema and ingest validation. |
| `@i18nprune/core/runtime/node` | Node `fs` / path adapters. |
| `@i18nprune/core/runtime/web` | Browser-safe adapter surface. |
| `@i18nprune/core/runtime/edge` | Worker / edge adapter surface. |
| `@i18nprune/core/runtime/helpers/sync` | Sync FS helpers shared across runtimes. |

Prefer the **smallest subpath** that fits your bundle; fall back to the root entry when you need several domains in one script.

## Operation entry points

Command-equivalent **`runXxx`** functions (non-exhaustive):

| Operation | Entry | CLI twin |
|-----------|--------|----------|
| Validate | `runValidate` | `i18nprune validate` |
| Sync | `runSync` | `i18nprune sync` |
| Generate | `runGenerate` | `i18nprune generate` |
| Translate | `runTranslate` | provider pipeline |
| Missing | `runMissing` | `i18nprune missing` |
| Quality | `runQuality` | `i18nprune quality` |
| Review | `runReview` | `i18nprune review` |
| Cleanup | `runCleanup` | `i18nprune cleanup` |
| Doctor | `runDoctor` | `i18nprune doctor` |
| Report | `runReport` | `i18nprune report` |
| Share | `runShare` | `i18nprune share` |
| Init | `runInit` | `i18nprune init` |

Deep wiring table (maintainer clone): `maintainer/systems/operations/entrypoints.md`.

## Runtime adapters

| Host | Import |
|------|--------|
| Node / scripts / CI | `@i18nprune/core/runtime/node` |
| Browser tooling | `@i18nprune/core/runtime/web` |
| Workers / edge | `@i18nprune/core/runtime/edge` |

Docs: [Runtime overview](https://docs.i18nprune.dev/runtime)

## Config, cache, and contracts

- **Config:** `locales.structure`, cache profiles (`safe` | `balanced` | `fast`), translation providers — see [Config hub](https://docs.i18nprune.dev/config)
- **Cache:** per-project analysis + persisted translation cache; hosts must not fork rebuild policy — see [CLI cache](https://docs.i18nprune.dev/cli/cache)
- **CLI JSON parity:** stable issue codes and `--json` envelope helpers via `result` exports — see [CLI JSON](https://docs.i18nprune.dev/cli/json) and [Issues](https://docs.i18nprune.dev/issues)
- **Reports:** build payloads with `runReport`; validate ingest with `@i18nprune/core/report-schema` before upload

## Examples (monorepo)

Runnable SDK samples live under `examples/sdk/` in the [i18nprune repository](https://github.com/zamdevio/i18nprune):

- `examples/sdk/sync/runSync.ts`
- `examples/sdk/generate/runGenerate.ts`
- `examples/sdk/missing/runMissing.ts`
- `examples/sdk/quality/runQuality.ts`
- `examples/sdk/review/runReview.ts`
- `examples/sdk/doctor/runDoctor.ts`
- `examples/sdk/share/runShareList.ts`
- `examples/sdk/translate/runTranslate.ts`

## CLI-only users

If you only need the terminal tool, install the root package instead:

```bash
npm install -g i18nprune
```

Bundled programmatic surface: `import … from 'i18nprune/core'` (rolled build, not granular subpaths).

## Documentation

- [SDK operations](https://docs.i18nprune.dev/sdk/operations)
- [Architecture](https://docs.i18nprune.dev/architecture)
- [Commands](https://docs.i18nprune.dev/commands)
- Live site: [docs.i18nprune.dev](https://docs.i18nprune.dev)

## License

MIT — see [LICENSE](https://github.com/zamdevio/i18nprune/blob/main/LICENSE) in the monorepo root.
