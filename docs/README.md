# i18nprune documentation

These pages are written for a **Nextra** site: each topic lives in its own folder with a **`README.md`**.

## Links

| Resource | URL |
|----------|-----|
| **Docs site** | [i18nprune.zamdev.dev](https://i18nprune.zamdev.dev) |
| **Repository** | [github.com/zamdevio/i18nprune](https://github.com/zamdevio/i18nprune) |
| **npm package** | [npmjs.com/package/@zamdevio/i18nprune](https://www.npmjs.com/package/@zamdevio/i18nprune) |

## Index

| Topic | Description |
|--------|-------------|
| [Exports](./exports/README.md) | **`@zamdevio/i18nprune/config`** & **`/core`** — programmatic API |
| [Examples](./examples/README.md) | Advanced CLI workflows (CI, `--report-file`, batch sync/fill, cleanup) |
| [Contributing](./contributors/README.md) | Repo patterns; links to [Agents](./agents/README.md) for AI-assisted contributors |
| [Commands](./commands/README.md) | One page per CLI subcommand |
| [CLI overview](./cli/README.md) | Entry point, global flags, `preprocessArgv` |
| [Quiet, silent & JSON](./cli/verbosity/README.md) | `RunOptions`, `logger`, output policy |
| [CLI runtime](./cli/runtime/README.md) | `getRunOptions` / `setRunOptions` vs full `Context` |
| [Architecture](./architecture/README.md) | Layers and data flow |
| [Languages catalog](./architecture/languages/README.md) | `languages.json`, generator |
| [Project tree](./architecture/tree/README.md) | Source / tooling layout (excludes `dist`, docs site) |
| [ADRs](./architecture/decisions/001-scope-v0-1.md) | Architecture decision records |
| [ADR template](./architecture/decisions/template.md) | Skeleton for new ADRs |
| [ADR 003 — User i18n loader](./architecture/decisions/003-user-i18n-loader-integration.md) | Opt-in loader integration (proposed) |
| [Loader & config plan](./architecture/i18n-loader-and-config-plan.md) | User-project i18n module (future) |
| [Vision](./vision/README.md) | Product direction |
| [Roadmap](./roadmap/README.md) | High-level direction |
| [Workflow](./workflow/README.md) | Local dev commands |
| [Agents](./agents/README.md) | Onboarding for contributors & coding agents — **[analysis](./agents/analysis.md)** (full map), **[git](./agents/git.md)** (commit discipline) |
| [Barriers](./barriers/README.md) | Adoption friction |
| [Config](./config/README.md) | Config file formats, merge order, `defineConfig` |
| [Policies](./config/policies/README.md) | `policies.preserve` / `policies.parity` |
| [Exit codes & signals](./behavior/README.md) | Exit codes, SIGINT, interactive vs CI |
| [Command behaviors](./behavior/commands.md) | Snapshot table: flags, JSON, translator commands |
| *(local only)* | **`CURRENT_PHASE.md`** (gitignored) and optional **`docs/phases/`** (gitignored) — near-term tasks; not shipped with the repo |
| [Translator & progress](./architecture/translator-and-progress.md) | Provider + `translateLeaf`, stderr progress, `generate` / `fill` |
| [Translation progress](./progress/README.md) | Live bar policy (`-q` / `-s` / `--json`), `src/core/progress/*` |
| [Patching](./patching/README.md) | Opt-in loader + config auto-patches ([ADR 004](./architecture/decisions/004-auto-patch.md)) |

## Nextra

Edit **`docs/`** only; run `pnpm docs:sync` from the repo root to refresh `nextra/content/`.
