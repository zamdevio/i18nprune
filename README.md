<div align="center">

# i18nprune

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-package%20manager-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

**Validate · sync · generate · fill · review · quality · cleanup · doctor**

</div>

**i18nprune** is a production-oriented **TypeScript CLI** for **i18n workflows**: it connects **your source code**, a **source-of-truth locale JSON**, and **target locale files** so teams can ship translations with confidence. It is **MIT licensed** and designed for **extension**—clear layers, published **`@zamdevio/i18nprune/config`** and **`@zamdevio/i18nprune/core`** entrypoints for scripts and tooling, and a roadmap open to **community and automation** alike.

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
| **Docs site** | [i18nprune.zamdev.dev](https://i18nprune.zamdev.dev) |
| **Repository** | [github.com/zamdevio/i18nprune](https://github.com/zamdevio/i18nprune) |
| **npm** | [npmjs.com/package/@zamdevio/i18nprune](https://www.npmjs.com/package/@zamdevio/i18nprune) |
| **Repo docs (source of truth)** | [`docs/README.md`](./docs/README.md) |
| **Exports (config + core)** | [`docs/exports/README.md`](./docs/exports/README.md) |

Local preview: **`pnpm docs:dev`** — run **`pnpm docs:sync`** so `docs/` mirrors into `nextra/content/`.

---

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm dev -- --help
pnpm docs:sync       # docs/ → nextra/content/
pnpm docs:dev        # Nextra dev server (port 8181)
pnpm docs:build      # static site in nextra/out/
```

## Project layout

| Path | Role |
|------|------|
| `bin/cli.ts` | Commander entry, `preprocessArgv`, global flags |
| `src/argv/` | Argv preprocessing (`--langs` → `languages`) |
| `src/types/` | Shared TypeScript types |
| `src/commands/` | One folder per command |
| `src/exports/` | Published entrypoints: `config`, `core` |
| `src/utils/logger/` | `canPrint*` policy + `logger` / `loggerFor` |
| `docs/` | Nextra-ready markdown |
| `tests/fixtures/sample-i18n-app/` | Sample app for integration tests |

---

## Roadmap

See [docs/roadmap/README.md](./docs/roadmap/README.md). Near-term maintainer tasks may live in repo-root **`CURRENT_PHASE.md`** (gitignored).

---

## Examples

📎 **Workflow recipes** (CI, `--report-file`, `fill --lang all`, safe cleanup): [docs/examples/README.md](./docs/examples/README.md)

---

## Contributing

**Repo patterns, PR expectations, and human + agent workflows:** [docs/contributors/README.md](./docs/contributors/README.md)

**Coding agents & deep onboarding** (architecture map, Git commit discipline): [docs/agents/README.md](./docs/agents/README.md) · [analysis](./docs/agents/analysis.md) · [git](./docs/agents/git.md)

---

## License

MIT — see [LICENSE](./LICENSE).
