# i18nprune documentation

These pages are written for a **Nextra** site: each topic lives in its own folder with a **`README.md`**.

## Links

| Resource | URL |
|----------|-----|
| **Docs site** | [docs.i18nprune.dev](https://docs.i18nprune.dev) |
| **Repository** | [github.com/zamdevio/i18nprune](https://github.com/zamdevio/i18nprune) |
| **npm package** | [npmjs.com/package/@zamdevio/i18nprune](https://www.npmjs.com/package/@zamdevio/i18nprune) |

## Index

**One topic → one home:** [Canonical topic map](./CANONICAL_TOPICS.md).

| Topic | Description |
|--------|-------------|
| [Exports](./exports/README.md) | **`@zamdevio/i18nprune/config`** & **`/core`** — programmatic API |
| [Examples](./examples/README.md) | Advanced CLI workflows (CI, `--report-file`, batch sync/fill, cleanup) |
| [Dynamic keys](./dynamic/README.md) | Reduce dynamic usage; configure `functions`; how the tool classifies sites |
| [Contributing](./contributors/README.md) | Repo patterns; links to [Agents](./agents/README.md) for AI-assisted contributors |
| [Commands](./commands/README.md) | One page per CLI subcommand (incl. [`missing`](./commands/missing/README.md)) |
| [CLI overview](./cli/README.md) | Entry point, global flags, `preprocessArgv` |
| [JSON output (`--json`)](./json/README.md) | Machine-readable CLI stdout: envelope, flags, `data` payloads |
| [Issue codes](./json/issue-codes.md) | Stable `issues[]` codes for `--json` and library |
| [Pre-release doc checklist](./temp/final.md) | Refresh tree / exports / links before shipping a phase |
| [Edge cases](./edge-cases/README.md) | Solved pitfalls (per-file const maps, CLI `--json` parity) |
| [Quiet, silent & JSON](./cli/verbosity/README.md) | `RunOptions`, `logger`, output policy |
| [CLI runtime](./cli/runtime/README.md) | `getRunOptions` / `setRunOptions` vs full `Context` |
| [Architecture](./architecture/README.md) | Layers and data flow |
| [Languages catalog](./architecture/languages/README.md) | `languages.json`, generator |
| [Project tree](./architecture/tree/README.md) | Source / tooling layout (excludes `dist`, docs site) |
| [ADRs](./architecture/decisions/001-scope-v0-1.md) | Architecture decision records |
| [ADR template](./architecture/decisions/template.md) | Skeleton for new ADRs |
| [ADR 003 — User i18n loader](./architecture/decisions/003-user-i18n-loader-integration.md) | Opt-in loader integration (proposed) |
| [ADR 005 — Dynamic key rebuild & prefix](./architecture/decisions/005-dynamic-key-rebuild-and-prefix.md) | Const map, template rebuild, `resolvedPrefix` |
| [Loader & config](./patching/loader.md) | User-project i18n module (future) |
| [Prompts & CLI boundaries](./prompts/README.md) | Inquirer scope, `--json` / CI, utils debt |
| [Command orchestration](./commands/orchestration/README.md) | Command vs `core` file layout |
| [Programmatic API & JSON](./json/programmatic.md) | Library `Result` roadmap vs CLI `--json` |
| [Translator engine](./translator/README.md) | Provider, `translateLeaf`, `generate` / `fill` flows |
| [Vision](./vision/README.md) | Product direction |
| [npm scope & org (future)](./org/README.md) | Reserved **`@i18nprune`** org; possible migration from **`@zamdevio`** — planning only |
| [Roadmap](./roadmap/README.md) | High-level direction |
| [Workflow](./workflow/README.md) | Local dev commands |
| [Agents](./agents/README.md) | Onboarding for contributors & coding agents — **[analysis](./agents/analysis.md)** (full map), **[git](./agents/git.md)** (commit discipline) |
| [Barriers](./barriers/README.md) | Adoption friction |
| [Config](./config/README.md) | Config file formats, merge order, `defineConfig` |
| [Policies](./config/policies/README.md) | `policies.preserve` / `policies.parity` |
| [Exit codes & signals](./behavior/README.md) | Exit codes, SIGINT, interactive vs CI |
| [Command behaviors](./behavior/commands.md) | Snapshot table: flags, JSON, translator commands |
| [Phases (maintainers)](./phases/README.md) | Phase index, **completed** sprint records (`docs/phases/**`) — included in the docs tree when you run **`pnpm run docs:sync`** |
| [Translation progress](./progress/README.md) | Live bar policy (`-q` / `-s` / `--json`), `packages/cli/src/core/progress/*` |
| [Patching](./patching/README.md) | Opt-in loader + config auto-patches ([ADR 004](./architecture/decisions/004-auto-patch.md)) |
| [Origin](./origin/README.md) | Why the project exists — real constraints, not a toy; link to CepatEdge context |
| [Cursor](./cursor/README.md) | How the repo was built — agent acceleration, usage limits, human direction |
| [Launch & adoption](./launch/README.md) | Pre-launch checklist & positioning; [distribution scheduling](./launch/distribution.md) for posts/changelog timing |

## Nextra

Edit **`docs/`** only; run `pnpm docs:sync` from the repo root to refresh `apps/docs/content/`.
