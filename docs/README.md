# i18nprune documentation

Keep your translation keys and locale files aligned without guesswork. i18nprune helps teams detect drift, review dynamic key risks, and automate safe locale maintenance in CI and local development.

Start with [Onboarding](./onboarding/README.md) for the shortest path, then use [Commands](./commands/README.md) and [Examples](./examples/README.md) for day-to-day usage.

## Install

Install globally for quick CLI access:

```bash
npm install -g i18nprune
# or: pnpm add -g i18nprune
```

Or run on demand without a global install:

```bash
npx i18nprune --help
pnpm dlx i18nprune --help
yarn dlx i18nprune --help
```

## Documentation map

| Topic | Description |
|--------|-------------|
| [Onboarding](./onboarding/README.md) | Choose your path (CLI / SDK / CI / Hosted) and get to first value quickly |
| [Commands](./commands/README.md) | Day-to-day command reference with one page per subcommand |
| [Examples](./examples/README.md) | Real workflows (CI gates, `stdout` piping, batch sync, `generate --resume`) |
| [Config](./config/README.md) | Config formats, merge behavior, and `defineConfig` authoring |
| [CLI overview](./cli/README.md) | Global flags, command entry behavior, and argument preprocessing |
| [JSON output (`--json`)](./cli/json.md) | Stable machine-readable envelope and command payload shapes |
| [Issues reference](./issues/README.md) | Stable issue codes and remediation guidance |
| [Contributing](./contributors/README.md) | Contributor path for repository setup, testing, and PR discipline |
| [Architecture](./architecture/README.md) | System layers, topology, and cross-component data flow |
| [Project tree](./architecture/tree.md) | Source and tooling layout at a glance |
| [SDK operations](./sdk/operations.md) | Programmatic operation entry points and contracts |
| [Patching](./patching/README.md) | Opt-in loader/config patching model and constraints |
| [Translator engine](./translator/README.md) | Provider orchestration and translation pipeline behavior |
| [Performance](./performance.md) | Large-repo strategies, cache guidance, and timing methodology |
| [Edge cases](./edge-cases/README.md) | Known pitfalls and parity-sensitive behavior notes |
| [ADRs](./architecture/decisions/001-scope-v0-1.md) | Architecture decision records and long-lived trade-offs |
| [ADR template](./architecture/decisions/template.md) | Template for proposing or documenting architectural changes |
| [Changelog](./changelog.md) | User-visible release notes and behavior changes |
| [Workflow](./workflow.md) | Local development workflow and routine maintenance commands |
| Agent notes (repo-only) | Clone the repo: `maintainer/agents/README.md` — [GitHub](https://github.com/zamdevio/i18nprune/blob/main/maintainer/agents/README.md) (not mirrored to the docs site) |
| Maintainer phases (repo only) | Sprint/v1 sequencing in `maintainer/phases/README.md` — [GitHub](https://github.com/zamdevio/i18nprune/blob/main/maintainer/phases/README.md) (not mirrored to the docs site) |

## Links

| Resource | URL |
|----------|-----|
| **Docs site** | [docs.i18nprune.dev](https://docs.i18nprune.dev) |
| **Repository** | [github.com/zamdevio/i18nprune](https://github.com/zamdevio/i18nprune) |
| **npm package** | [npmjs.com/package/i18nprune](https://www.npmjs.com/package/i18nprune) |