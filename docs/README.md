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

## Documentation journey

| Step | Topic | Link |
|------|--------|------|
| 1 | Onboarding (CLI / SDK / CI / hosted) | [Onboarding](./onboarding/README.md) |
| 2 | Commands & examples | [Commands](./commands/README.md) · [Examples](./examples/README.md) |
| 3 | Config, CLI, JSON, issues | [Config](./config/README.md) · [CLI](./cli/README.md) · [JSON (`--json`)](./cli/json.md) · [Issues](./issues/README.md) |
| 4 | Architecture & SDK | [Architecture](./architecture/README.md) · [SDK operations](./sdk/operations.md) · [Runtime](./runtime/README.md) |
| 5 | Edge cases & ADRs | [Edge cases](./edge-cases/README.md) · [ADRs](./architecture/decisions/007-cli-json-envelope-contract.md) |

## Topic index

| Topic | Description |
|--------|-------------|
| [Onboarding](./onboarding/README.md) | Choose your path and get to first value quickly |
| [Commands](./commands/README.md) | Day-to-day command reference |
| [Examples](./examples/README.md) | CI gates, jq recipes, `generate --resume`, batch sync |
| [Config](./config/README.md) | Config formats, merge behavior, `defineConfig` |
| [CLI overview](./cli/README.md) | Global flags and argument preprocessing |
| [JSON output (`--json`)](./cli/json.md) | Stable machine-readable envelope (canonical contract) |
| [Issues reference](./issues/README.md) | Stable issue codes and remediation |
| [Contributing](./contributors/README.md) | Repository setup, testing, PR discipline |
| [Architecture](./architecture/README.md) | System layers and data flow |
| [ADRs](./architecture/decisions/001-scope-v0-1.md) | Architecture decision records |
| [Edge cases](./edge-cases/README.md) | Solved pitfalls and parity-sensitive notes |
| [Changelog](./changelog.md) | User-visible release notes |

## Links

| Resource | URL |
|----------|-----|
| **Docs site** | [docs.i18nprune.dev](https://docs.i18nprune.dev) |
| **Repository** | [github.com/zamdevio/i18nprune](https://github.com/zamdevio/i18nprune) |
| **npm package** | [npmjs.com/package/i18nprune](https://www.npmjs.com/package/i18nprune) |
