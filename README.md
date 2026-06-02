<div align="center">

# i18nprune

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-package%20manager-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

**Validate · sync · generate · review · quality · cleanup · doctor**

[Documentation](https://docs.i18nprune.dev) · [Quick start](#quick-start) · [npm](https://www.npmjs.com/package/i18nprune)

</div>

**i18nprune** keeps translation keys, locale JSON, and source scans aligned — in the terminal, in CI, or from **`@i18nprune/core`** in your own scripts. One config, one **`--json`** contract, and honest limits on static key extraction.

---

## Install

**Global CLI**

```bash
npm install -g i18nprune
# or: pnpm add -g i18nprune
# or: yarn global add i18nprune
```

**On demand (no global install)**

```bash
npx i18nprune --help
pnpm dlx i18nprune --help
yarn dlx i18nprune --help
```

**From source (contributors)**

```bash
git clone https://github.com/zamdevio/i18nprune.git && cd i18nprune
pnpm install && pnpm build
pnpm link --global   # optional
i18nprune version
```

Requires **Node.js ≥ 18**.

---

## Quick start

```bash
i18nprune init --yes
i18nprune validate
i18nprune doctor --json
i18nprune sync --dry-run
```

Typed config: **`i18nprune init`** writes **`i18nprune.config.ts`** (see [config docs](./docs/config/README.md)).

---

## Documentation journey

| Step | Where to go |
|------|-------------|
| **1 — Pick your path** | [Onboarding hub](./docs/onboarding/README.md) (CLI · SDK · CI · hosted) |
| **2 — Day-to-day commands** | [Commands](./docs/commands/README.md) · [Examples](./docs/examples/README.md) |
| **3 — Config & machine output** | [Config](./docs/config/README.md) · [CLI overview](./docs/cli/README.md) · [**JSON contract**](./docs/cli/json.md) · [Issues](./docs/issues/README.md) |
| **4 — Architecture & reference** | [Architecture](./docs/architecture/README.md) · [ADRs](./docs/architecture/decisions/007-cli-json-envelope-contract.md) · [Runtime](./docs/runtime/README.md) · [SDK operations](./docs/sdk/operations.md) |
| **5 — Edge cases** | [Solved pitfalls](./docs/edge-cases/solved/README.md) · [Performance](./docs/performance.md) |

**Live site:** [docs.i18nprune.dev](https://docs.i18nprune.dev) · **Source index:** [`docs/README.md`](./docs/README.md)

---

## Capabilities

| Area | What you get |
|------|----------------|
| **Validate** | Literal keys in `src/` vs source locale; dynamic call sites reported separately. |
| **Sync** | Merge/prune locale shape; optional metadata modes. |
| **Generate** | Provider-backed translation; **`--resume`** tops up missing leaves. |
| **Quality / review** | Parity and drift signals; **`--json`** on supported commands. |
| **Cleanup** | Remove unused keys; **`--yes`** for CI. |
| **Share** | Upload snapshots/reports to the public worker; local cache + hash dedup. |
| **Doctor** | Node, `rg`, config, paths — **`--json`**, **`--strict`**. |

---

## Programmatic API

Use the same engines as the CLI without subprocesses:

```typescript
import { resolveContext, runValidate } from '@i18nprune/core';
```

- **`@i18nprune/core`** — `resolveContext`, `runXxx` operations, cache policy, share prepare.
- **`i18nprune/core`** (from the published CLI package) — `defineConfig` and config types bundled with **`i18nprune`**.

Full reference: [SDK operations](./docs/sdk/operations.md) · Runtime hosts: [Node](./docs/runtime/node.md) · [Web](./docs/runtime/web.md) · [Worker](./docs/runtime/worker.md)

---

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm docs:dev        # VitePress + sync from docs/ (port 8282)
pnpm docs:build      # static site
```

| Path | Role |
|------|------|
| `packages/cli/` | Commander CLI, `--json` envelopes, command orchestration |
| `packages/core/` | Domain logic, cache policy, share prepare, `runXxx` |
| `docs/` | Authoritative markdown → `apps/docs/content/` via `pnpm docs:sync` |
| `apps/docs/` | VitePress site ([docs.i18nprune.dev](https://docs.i18nprune.dev)) |

---

## Contributing

[Contributors guide](./docs/contributors/README.md) — setup, tests, PR expectations.

---

## License

MIT — see [LICENSE](./LICENSE).
