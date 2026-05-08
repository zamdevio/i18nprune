# i18nprune documentation

Start here if you want to use i18nprune fast: follow [Onboarding](./onboarding/README.md) for the shortest path, use [Commands](./commands/README.md) and [Examples](./examples/README.md) for practical usage, and open [Architecture](./architecture/README.md) only when you need deeper technical internals.

## Links

| Resource | URL |
|----------|-----|
| **Docs site** | [docs.i18nprune.dev](https://docs.i18nprune.dev) |
| **Repository** | [github.com/zamdevio/i18nprune](https://github.com/zamdevio/i18nprune) |
| **npm package** | [npmjs.com/package/i18nprune](https://www.npmjs.com/package/i18nprune) |

## Index

| Topic | Description |
|--------|-------------|
| [Exports](./exports/README.md) | **`i18nprune`** (CLI tarball), **`i18nprune/core`**, **`@i18nprune/core`** — programmatic surface |
| [Examples](./examples/README.md) | Advanced CLI workflows (CI, `stdout redirection`, batch sync/fill, cleanup) |
| [Onboarding](./onboarding/README.md) | Start in 60 seconds path for first successful run |
| [Dynamic keys](./dynamic/README.md) | Reduce dynamic usage; configure `functions`; how the tool classifies sites |
| [Contributing](./contributors/README.md) | Repo patterns; references maintainer agent notes (repo-only) for AI-assisted contributors |
| [Commands](./commands/README.md) | One page per CLI subcommand (incl. [`missing`](./commands/missing/README.md)) |
| [CLI overview](./cli/README.md) | Entry point, global flags, `preprocessArgv` |
| [JSON output (`--json`)](./json/README.md) | Machine-readable CLI stdout: envelope, flags, `data` payloads |
| [Issues reference](./issues/README.md) | Stable `issues[]` codes for `--json` and library |
| [Edge cases](./edge-cases/README.md) | Solved pitfalls (per-file const maps, CLI `--json` parity) |
| [Changelog](./changelog/README.md) | Release-note conventions and web changelog alignment |
| [Parity release checklist](./release/parity-checklist/README.md) | Pre-release gate for CLI/JSON/docs/web parity |
| [Quiet, silent & JSON](./cli/verbosity/README.md) | `RunOptions`, `logger`, output policy |
| [CLI runtime](./cli/runtime/README.md) | `getRunOptions` / `setRunOptions` vs full `Context` |
| [Performance](./performance/README.md) | Large-repo validation, `/usr/bin/time`, [Next.js](./performance/nextjs.md), [CepatEdge workflow](./performance/cepatedge.md) |
| [Architecture](./architecture/README.md) | Layers and data flow |
| [Core dependency graph (Madge)](./madge/README.md) | Structural checks: cycles, leaves, orphans; how to reproduce them |
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
| [Roadmap](./roadmap/README.md) | High-level direction |
| [Workflow](./workflow/README.md) | Local dev commands |
| Agent notes (repo-only) | See `maintainer/agents/README.md` for contributor/agent workflows, analysis, and Git commit discipline (not published on the docs site) |
| [Barriers](./barriers/README.md) | Adoption friction |
| [Config](./config/README.md) | Config file formats, merge order, `defineConfig` |
| [Policies](./config/policies/README.md) | `policies.preserve` / `policies.parity` |
| [Exit codes & signals](./behavior/README.md) | Exit codes, SIGINT, interactive vs CI |
| [Command behaviors](./behavior/commands.md) | Snapshot table: flags, JSON, translator commands |
| [Maintainer phases (repo only)](../maintainer/phases/README.md) | Sprint / v1 sequencing — **`maintainer/phases/`** is **not** mirrored to **`apps/docs`** |
| [Translation progress](./progress/README.md) | Live bar policy (`-q` / `-s` / `--json`), `packages/cli/src/core/progress/*` |
| [Patching](./patching/README.md) | Opt-in loader + config auto-patches ([ADR 004](./architecture/decisions/004-auto-patch.md)) |
| [Journey](./journey/README.md) | First-person story: CepatEdge i18n pressure → why this toolkit exists → open source |
| [Origin](./origin/README.md) | Why the project exists — real constraints, not a toy; link to CepatEdge context |
| [Cursor](./cursor/README.md) | How the repo was built — agent acceleration, usage limits, human direction |
| [Launch & adoption](./launch/README.md) | Pre-launch checklist & positioning; [distribution scheduling](./launch/distribution.md) for posts/changelog timing |
