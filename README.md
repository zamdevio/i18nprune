<div align="center">

# i18nprune

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-package%20manager-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

**Validate · sync · generate · review · quality · cleanup · doctor**

</div>

**i18nprune** is a **production-grade i18n toolkit** that combines a powerful CLI with stable programmatic APIs (**`i18nprune/core`** from the published tarball where applicable, **`@i18nprune/core`** for the workspace engine package).

It connects your **source code**, a **source-of-truth locale JSON**, and **target locale files** so teams can validate, sync, generate, clean up, and review translations with confidence — in CI or custom scripts. Clear architecture, excellent docs, and built for both humans and agents.

---

## Capabilities

| Area | What you get |
|------|----------------|
| **Validate** | Match **literal** translation keys in `src/` to the **source** JSON; report **dynamic** (non-literal) call sites. |
| **Sync** | **Merge + prune** every locale file to the source **shape**; optional **`policies.preserve`**; **`--lang`** for **`all`**, comma lists, or defaults; **`--dry-run`**. |
| **Generate** | Machine translation via the configured provider (**Google `gtx`** today); **catalog-backed** language codes; **`generate --resume`** tops up existing targets; **`generate --all`** with **`--resume`** covers every non-source locale. |
| **Quality / review** | Parity and drift signals; **per-locale** review vs source (**`--json`** on supported commands). |
| **Cleanup** | Remove **unused** keys with optional **ripgrep** verification, **confirmations**, and **global `--yes`** for CI. |
| **Locales** | **`list`**, **`edit`**, **`dynamic`** (heuristic non-literal sites), **`delete`** (with safety prompts). |
| **Languages** | Browse bundled **BCP47-style** codes for **generate**. |
| **Doctor** | Read-only checks: Node, `rg`, config, paths (**`--json`**, **`--strict`**). |
| **Report topic** | Project report export (`html` / `json` / `csv` / `text`) with optional `--json` stdout envelope. |
| **Automation** | Global **`--json`**, **`-q` / `-s`**, path overrides, **`I18NPRUNE_*`** env; **`--yes`** for non-interactive flows. |

---

## Programmatic API

Reuse the same primitives as the CLI **without subprocesses**:

- **`i18nprune/core`** — `defineConfig` + types (bundled with the **`i18nprune`** package).
- **`@i18nprune/core`** — `resolveContext`, scanning, literal extraction, dynamic-key heuristics, JSON leaf walks (same engine the CLI uses).

📚 **Full reference:** [docs/exports/README.md](./docs/exports/README.md)

---

## Requirements

- **Node.js** ≥ **18**
- **pnpm** (recommended) or npm

## Install

**npm CLI name:** **`i18nprune`** (first publish pending — until then use **From source** or **`pnpm link`**):

```bash
npm install -g i18nprune
# or: pnpm add -D i18nprune
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
| **npm** | [npmjs.com/package/i18nprune](https://www.npmjs.com/package/i18nprune) *(live after first publish)* |
| **Repo docs (source of truth)** | [`docs/README.md`](./docs/README.md) |
| **Exports (config + core)** | [`docs/exports/README.md`](./docs/exports/README.md) |
| **Why it exists** (backstory) | [`docs/origin/README.md`](./docs/origin/README.md) |
| **How it was built** (Cursor, agents, limits) | [`docs/cursor/README.md`](./docs/cursor/README.md) |
| **Launch & adoption** (positioning, public checklist) | [`docs/launch/README.md`](./docs/launch/README.md) |

Local docs preview: **`pnpm docs:dev`** — VitePress dev server (**`8282`** by default) plus **live sync** from **`docs/`** → **`apps/docs/content/`**.

---

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm dev -- --help
pnpm docs:sync       # one-shot docs/ → apps/docs/content/
pnpm docs:build      # static site → apps/docs/.vitepress/dist
pnpm docs:dev        # VitePress dev + watcher sync (port 8282 or next free)
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
| `apps/docs/` | VitePress docs site; **`pnpm docs:dev`** mirrors `docs/` into `content/` |
| `tests/fixtures/sample-i18n/` | Sample app for integration tests |

---

## Roadmap

See **[docs/roadmap/README.md](./docs/roadmap/README.md)** for product direction.

### Same core on Node, Web, and Workers

How **`@i18nprune/core`** runs per environment is covered on **[docs.i18nprune.dev](https://docs.i18nprune.dev/runtime/)**: **[docs/runtime/README.md](./docs/runtime/README.md)** — **[Node / CLI](./docs/runtime/node.md)**, **[Browser (Web)](./docs/runtime/web.md)** (**`web.i18nprune.dev`**), **[Worker / edge](./docs/runtime/worker.md)** (**`workers.i18nprune.dev`**).

**Contributors:** internal sequencing lives under **`maintainer/`** — starts from **`maintainer/README.md`** (not published via **`pnpm docs:sync`**).

---

## Examples

📎 **Workflow recipes** (CI, `--json` artifacts, `generate --resume --all`, safe cleanup): [docs/examples/README.md](./docs/examples/README.md)

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
