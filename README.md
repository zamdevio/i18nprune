<div align="center">

# i18nprune

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-package%20manager-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

**Validate · sync · generate · fill · review · quality · cleanup · doctor**

</div>

**i18nprune** is a **production-grade i18n toolkit** that combines a powerful CLI with stable programmatic APIs (`@zamdevio/i18nprune/config` + `@zamdevio/i18nprune/core`).

It connects your **source code**, a **source-of-truth locale JSON**, and **target locale files** so teams can validate, sync, generate, clean up, and review translations with confidence — in CI or custom scripts. Clear architecture, excellent docs, and built for both humans and agents.

---

## Capabilities

| Area | What you get |
|------|----------------|
| **Validate** | Match **literal** translation keys in `src/` to the **source** JSON; report **dynamic** (non-literal) call sites. |
| **Sync** | **Merge + prune** every locale file to the source **shape**; optional **`policies.preserve`**; **`--lang`** for **`all`**, comma lists, or defaults; **`--dry-run`**. |
| **Generate / fill** | Machine translation via the configured provider (**Google `gtx`** today); **catalog-backed** language codes; **`fill`** supports **`--lang all`** and multi-locale runs. |
| **Quality / review** | Parity and drift signals; **per-locale** review vs source (**`--json`** on supported commands). |
| **Cleanup** | Remove **unused** keys with optional **ripgrep** verification, **confirmations**, and **global `--yes`** for CI. |
| **Locales** | **`list`**, **`edit`**, **`dynamic`** (heuristic non-literal sites), **`delete`** (with safety prompts). |
| **Languages** | Browse bundled **BCP47-style** codes for **generate** / **fill**. |
| **Doctor** | Read-only checks: Node, `rg`, config, paths (**`--json`**, **`--strict`**). |
| **Report topic** | Help for global **`--report-file`** / **`--report-format`** (structured run artifacts). |
| **Automation** | Global **`--json`**, **`-q` / `-s`**, path overrides, **`--report-file`**, **`I18NPRUNE_*`** env; **`--yes`** for non-interactive flows. |

---

## Programmatic API

Reuse the same primitives as the CLI **without subprocesses**:

- **`@zamdevio/i18nprune/config`** — `defineConfig` + types for your config file.
- **`@zamdevio/i18nprune/core`** — `resolveContext`, scanning, literal extraction, dynamic-key heuristics, JSON leaf walks.

📚 **Full reference:** [docs/exports/README.md](./docs/exports/README.md)

---

## Requirements

- **Node.js** ≥ **18**
- **pnpm** (recommended) or npm

## Install

**Published package** (npm **`@zamdevio/i18nprune`**):

```bash
npm install -g @zamdevio/i18nprune
# or: pnpm add -D @zamdevio/i18nprune
```

**From source:**

```bash
git clone https://github.com/zamdevio/i18nprune.git && cd i18nprune
pnpm install
pnpm build
pnpm link --global   # optional
```

```bash
i18nprune --version
```

## Quick start

```bash
i18nprune init              # or: i18nprune init --yes
i18nprune validate
i18nprune languages
i18nprune config --json
i18nprune doctor --json
```

Copy **`i18nprune.config.ts.example`** to **`i18nprune.config.ts`** (or `.mts` / `.js` / `.mjs`). Raw JSON config files are not supported for the main config.

---

## Documentation

| Resource | Link |
|----------|------|
| **Docs site** | [docs.i18nprune.dev](https://docs.i18nprune.dev) |
| **Repository** | [github.com/zamdevio/i18nprune](https://github.com/zamdevio/i18nprune) |
| **npm** | [npmjs.com/package/@zamdevio/i18nprune](https://www.npmjs.com/package/@zamdevio/i18nprune) |
| **Repo docs (source of truth)** | [`docs/README.md`](./docs/README.md) |
| **Exports (config + core)** | [`docs/exports/README.md`](./docs/exports/README.md) |
| **Why it exists** (backstory) | [`docs/origin/README.md`](./docs/origin/README.md) |
| **How it was built** (Cursor, agents, limits) | [`docs/cursor/README.md`](./docs/cursor/README.md) |
| **Launch & adoption** (positioning, public checklist) | [`docs/launch/README.md`](./docs/launch/README.md) |

Local preview: **`pnpm docs:dev`** — run **`pnpm docs:sync`** so `docs/` mirrors into `apps/docs/content/`.

---

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm dev -- --help
pnpm docs:sync       # docs/ → apps/docs/content/
pnpm docs:build      # static site in apps/docs/out/
pnpm docs:dev        # Nextra dev server (port 8181)
pnpm web:dev         # i18nprune.dev landing (port 5174)
pnpm web:build       # static landing bundle in apps/web/dist
```

## Project layout

| Path | Role |
|------|------|
| `packages/cli/bin/cli.ts` | Commander entry, `preprocessArgv`, global flags |
| `packages/cli/src/argv/` | Argv preprocessing (`--langs` → `languages`) |
| `packages/cli/src/types/` | Shared TypeScript types |
| `packages/cli/src/commands/` | One folder per command |
| `packages/cli/src/exports/` | Published entrypoints: `config`, `core` |
| `packages/cli/src/utils/logger/` | `canPrint*` policy + `logger` / `loggerFor` |
| `docs/` | Authoritative markdown; **`pnpm docs:sync`** → `apps/docs/content/` |
| `apps/docs/` | Next.js + Nextra docs app |
| `tests/fixtures/sample-i18n-app/` | Sample app for integration tests |

---

## Roadmap

See [docs/roadmap/README.md](./docs/roadmap/README.md). Maintainer phase ordering lives in **[`docs/phases/README.md`](./docs/phases/README.md)**.

### Phase docs retention policy

Do **not** delete completed files under `docs/phases/` by default. Keep them as implementation history unless their decisions are already preserved in at least one of:

- `docs/architecture/decisions/` (ADR),
- `docs/architecture/`,
- or the canonical phase-folder `README.md` that supersedes them (for example `docs/phases/exports/README.md`).

---

## Examples

📎 **Workflow recipes** (CI, `--report-file`, `fill --lang all`, safe cleanup): [docs/examples/README.md](./docs/examples/README.md)

---

## Contributing

**Repo patterns, PR expectations, and human + agent workflows:** [docs/contributors/README.md](./docs/contributors/README.md)

**Coding agents & deep onboarding** (architecture map, Git commit discipline): [docs/agents/README.md](./docs/agents/README.md) · [analysis](./docs/agents/analysis.md) · [git](./docs/agents/git.md)

### Story & tooling

**Why i18nprune exists** — real-world context (pressure from a larger system, standalone toolkit decision): [docs/origin/README.md](./docs/origin/README.md).

**How this repository was shipped** — Cursor, agent-assisted iteration, plan limits, and what stayed human-owned: [docs/cursor/README.md](./docs/cursor/README.md).

---

## License

MIT — see [LICENSE](./LICENSE).
