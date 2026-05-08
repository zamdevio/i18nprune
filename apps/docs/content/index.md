# i18nprune documentation

Start here if you want to use i18nprune fast: follow [Onboarding](./onboarding) for the shortest path, use [Commands](./commands) and [Examples](./examples) for practical usage, and open [Architecture](./architecture) only when you need deeper technical internals.

## Links

| Resource | URL |
|----------|-----|
| **Docs site** | [docs.i18nprune.dev](https://docs.i18nprune.dev) |
| **Repository** | [github.com/zamdevio/i18nprune](https://github.com/zamdevio/i18nprune) |
| **npm package** | [npmjs.com/package/i18nprune](https://www.npmjs.com/package/i18nprune) |

## Index

| Topic | Description |
|--------|-------------|
| [Exports](./exports) | **`i18nprune`** (CLI tarball), **`i18nprune/core`**, **`@i18nprune/core`** — programmatic surface |
| [Examples](./examples) | Advanced CLI workflows (CI, `stdout redirection`, batch sync/fill, cleanup) |
| [Onboarding](./onboarding) | Start in 60 seconds path for first successful run |
| [Dynamic keys](./dynamic) | Reduce dynamic usage; configure `functions`; how the tool classifies sites |
| [Contributing](./contributors) | Repo patterns; links to [Agents](./agents) for AI-assisted contributors |
| [Commands](./commands) | One page per CLI subcommand (incl. [`missing`](./commands/missing)) |
| [CLI overview](./cli) | Entry point, global flags, `preprocessArgv` |
| [JSON output (`--json`)](./json) | Machine-readable CLI stdout: envelope, flags, `data` payloads |
| [Issues reference](./issues) | Stable `issues[]` codes for `--json` and library |
| [Edge cases](./edge-cases) | Solved pitfalls (per-file const maps, CLI `--json` parity) |
| [Changelog](./changelog) | Release-note conventions and web changelog alignment |
| [Parity release checklist](./release/parity-checklist) | Pre-release gate for CLI/JSON/docs/web parity |
| [Quiet, silent & JSON](./cli/verbosity) | `RunOptions`, `logger`, output policy |
| [CLI runtime](./cli/runtime) | `getRunOptions` / `setRunOptions` vs full `Context` |
| [Performance](./performance) | Large-repo validation, `/usr/bin/time`, [Next.js](./performance/nextjs.md), [CepatEdge workflow](./performance/cepatedge.md) |
| [Architecture](./architecture) | Layers and data flow |
| [Core dependency graph (Madge)](./madge) | Structural checks: cycles, leaves, orphans; how to reproduce them |
| [Languages catalog](./architecture/languages) | `languages.json`, generator |
| [Project tree](./architecture/tree) | Source / tooling layout (excludes `dist`, docs site) |
| [ADRs](./architecture/decisions/001-scope-v0-1.md) | Architecture decision records |
| [ADR template](./architecture/decisions/template.md) | Skeleton for new ADRs |
| [ADR 003 — User i18n loader](./architecture/decisions/003-user-i18n-loader-integration.md) | Opt-in loader integration (proposed) |
| [ADR 005 — Dynamic key rebuild & prefix](./architecture/decisions/005-dynamic-key-rebuild-and-prefix.md) | Const map, template rebuild, `resolvedPrefix` |
| [Loader & config](./patching/loader.md) | User-project i18n module (future) |
| [Prompts & CLI boundaries](./prompts) | Inquirer scope, `--json` / CI, utils debt |
| [Command orchestration](./commands/orchestration) | Command vs `core` file layout |
| [Programmatic API & JSON](./json/programmatic.md) | Library `Result` roadmap vs CLI `--json` |
| [Translator engine](./translator) | Provider, `translateLeaf`, `generate` / `fill` flows |
| [Vision](./vision) | Product direction |
| [Roadmap](./roadmap) | High-level direction |
| [Workflow](./workflow) | Local dev commands |
| [Agents](./agents) | Onboarding for contributors & coding agents — **[analysis](./agents/analysis.md)** (full map), **[git](./agents/git.md)** (commit discipline) |
| [Barriers](./barriers) | Adoption friction |
| [Config](./config) | Config file formats, merge order, `defineConfig` |
| [Policies](./config/policies) | `policies.preserve` / `policies.parity` |
| [Exit codes & signals](./behavior) | Exit codes, SIGINT, interactive vs CI |
| [Command behaviors](./behavior/commands.md) | Snapshot table: flags, JSON, translator commands |
| [Maintainer phases (repo only)](../maintainer/phases) | Sprint / v1 sequencing — **`maintainer/phases/`** is **not** mirrored to **`apps/docs`** |
| [Translation progress](./progress) | Live bar policy (`-q` / `-s` / `--json`), `packages/cli/src/core/progress/*` |
| [Patching](./patching) | Opt-in loader + config auto-patches ([ADR 004](./architecture/decisions/004-auto-patch.md)) |
| [Journey](./journey) | First-person story: CepatEdge i18n pressure → why this toolkit exists → open source |
| [Origin](./origin) | Why the project exists — real constraints, not a toy; link to CepatEdge context |
| [Cursor](./cursor) | How the repo was built — agent acceleration, usage limits, human direction |
| [Launch & adoption](./launch) | Pre-launch checklist & positioning; [distribution scheduling](./launch/distribution.md) for posts/changelog timing |
