<div align="center">
  <img src="https://i18nprune.dev/i18nprune.svg" width="72" height="72" alt="i18nprune logo" />

  <h1>i18nprune</h1>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
  [![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![pnpm](https://img.shields.io/badge/pnpm-package%20manager-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

  <p><strong>Validate · sync · generate · review · quality · cleanup · doctor</strong></p>
  <p>
    Production-grade i18n toolkit for validating, syncing, translating, and shipping locale data with confidence.
  </p>
  <p>
    <a href="https://i18nprune.dev">Website</a> ·
    <a href="https://docs.i18nprune.dev">Docs</a> ·
    <a href="https://releases.i18nprune.dev">Releases</a> ·
    <a href="#quick-start">Quick start</a>
  </p>
</div>

---

Ship reliable i18n workflows across source code, locale files, CI, and hosted review flows. i18nprune runs one shared engine across SDK, CLI, web/report apps, workers, and a VS Code extension host (**in development**).

| Surface | URL | Role |
|---------|-----|------|
| **Website** | [i18nprune.dev](https://i18nprune.dev) | Product overview and onboarding |
| **Documentation** | [docs.i18nprune.dev](https://docs.i18nprune.dev) | CLI, SDK, config, commands, architecture |
| **Release notes** | [releases.i18nprune.dev](https://releases.i18nprune.dev) | CLI, Core, and Extension version history |
| **Web app** | [web.i18nprune.dev](https://web.i18nprune.dev) | Hosted project snapshots and workspace links |
| **Report app** | [report.i18nprune.dev](https://report.i18nprune.dev) | View and share `report --json` documents |
| **Worker API** | [worker.i18nprune.dev/docs](https://worker.i18nprune.dev/docs) | Share/upload and report ingest OpenAPI |
| **Meta API** | [meta.i18nprune.dev/docs](https://meta.i18nprune.dev/docs) | Cached GitHub/npm metadata for apps |

## Install

Requires **Node.js >= 18**.

```bash
# global CLI
npm install -g i18nprune
# or: pnpm add -g i18nprune
# or: yarn global add i18nprune
```

```bash
# on-demand without global install
npx i18nprune --help
pnpm dlx i18nprune --help
yarn dlx i18nprune --help
```

## SDK First (`@i18nprune/core`)

Use the core engine directly when you want full programmatic control in scripts, CI jobs, bots, or app integrations.

```ts
import { resolveContext, runSync } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

const ctx = await resolveContext({
  projectRoot: process.cwd(),
  adapters: createNodeRuntimeAdapters(),
});

const result = await runSync(ctx, {
  dryRun: true,
});
```

Why SDK consumers pick this:

- Runtime-neutral operation entry points (`runXxx`) with shared behavior contracts.
- Config/context resolution without shelling out to the CLI.
- Stable issue-code semantics used by CLI JSON output.
- Reusable cache/share internals for advanced host integrations.
- Cross-platform behavior aligned across Linux, macOS, and Windows (same core + CLI contracts).

Primary references:

- [SDK operations](./docs/sdk/operations.md)
- [Runtime overview](./docs/runtime/README.md)
- [Architecture](./docs/architecture/README.md)

Platform note: CI validates core CLI/SDK flows across the three main OS families (Linux, macOS, Windows), which is why path/cache behavior is explicitly documented and parity-guarded.

## Why teams choose i18nprune

- Locale layout flexibility (`flat_file`, `locale_directory`, `locale_per_dir`, `feature_bundle`).
- High-signal extraction with deterministic static-analysis boundaries.
- Fast repeat runs via project cache + persisted translation cache.
- Strong CI contract (`--json`, stable issue codes, non-interactive behavior).
- Hosted share/report workflows for collaboration and review links.

## Quick start

Get to value fast:

```bash
i18nprune init --yes
i18nprune validate
i18nprune doctor --json
i18nprune sync --dry-run
```

## Hosts and Surfaces

### CLI (primary operator surface)

The CLI is the fastest path for teams and CI pipelines.

- `validate`: code keys vs source locale.
- `sync`: merge/prune locale shape and normalize leaf modes.
- `generate`: provider translation with `--resume`.
- `missing`, `quality`, `review`, `cleanup`, `doctor`, `report`, `share`.
- Global machine contract: `--json` (see [CLI JSON contract](./docs/cli/json.md)).

Provider ecosystem:

- Use `i18nprune providers` to list available translation providers and required env/config.
- Use `i18nprune providers --json` for machine-readable provider metadata.

### Web and Report apps

- `apps/web`: workspace UX for shared project snapshots.
- `apps/report`: report viewer/import workflows for shared report documents.

### VS Code extension (in development)

- `apps/extension/`: editor host for diagnostics, init/onboarding, and project intelligence — **planned post-v1**, same `@i18nprune/core` engine and CLI `--json` contracts as other hosts (no duplicated scan logic).
- Planning and sequencing: [`maintainer/phases/extension/README.md`](./maintainer/phases/extension/README.md) (maintainer-only until a public extension doc ships).

### Workers

- `apps/workers/i18nprune`: hosted share/report APIs and metadata paths.
- `apps/workers/meta`: metadata and auxiliary service endpoints.

## Locale layout support

i18nprune supports real-world locale repository topologies without forcing a single folder shape.

- `flat_file` (default): `locales/en.json`, `locales/fr.json`
- `locale_directory` + `locale_per_dir`: `messages/en/common.json`, `messages/fr/common.json`
- `locale_directory` + `feature_bundle`: `messages/auth/en.json`, `messages/auth/fr.json`

Key behavior:

- `locales.structure` is required when `mode=locale_directory`.
- Shape is schema-first from extracted keys (not blind mirroring of nested source JSON).
- Writer leaf modes: `legacy_string` and `structured` metadata mode (`--metadata`, `--strip-metadata`).

Reference: [Locales config](./docs/config/locales.md)

## Extraction engine details

Extraction is intentionally layered and conservative so hosts (SDK, CLI, web, worker) can rely on deterministic behavior:

- Literal key extraction from configured translation call sites.
- Dynamic key detection with reporting surfaces (`validate`, `locales dynamic`).
- Per-file const-map reuse for rebuildable template keys.
- Import/binding-aware extraction paths across parser providers.
- Multi-line call support and static-analysis limit handling.
- Comment-aware scanning with commented-out call classification.

Result: high-signal extraction on real code without unsafe runtime guessing.

References:

- [Extraction architecture](./docs/architecture/extraction/README.md)
- [Dynamic key handling](./docs/architecture/extraction/dynamic.md)

## SDK consumer examples

If you are embedding i18nprune in your own scripts or services, start from these SDK examples:

- `examples/sdk/doctor/runDoctor.ts`
- `examples/sdk/generate/runGenerate.ts`
- `examples/sdk/missing/runMissing.ts`
- `examples/sdk/quality/runQuality.ts`
- `examples/sdk/review/runReview.ts`
- `examples/sdk/share/runShareList.ts`
- `examples/sdk/sync/runSync.ts`
- `examples/sdk/translate/runTranslate.ts`

These examples show direct `@i18nprune/core` consumption without shelling out to CLI.

## Cache architecture (speed + determinism)

Cache is per-project, persisted, and host-aware:

- Home root defaults to `~/.i18nprune` (or `%USERPROFILE%\\.i18nprune` on Windows).
- Override full home with `I18NPRUNE_HOME`.
- Project cache under `<home>/cache/projects/<projectId>/` with:
  - `files.json` (fingerprints + locale layout state)
  - `analysis.json` (scan payload shared by multiple commands)
  - `translations/<code>.json` (persisted translation cache)
- Translation cache is two-layer:
  - L1 in-process memo
  - L2 persisted per-target translation files
- Profiles and tuning: `safe`, `balanced`, `fast` (`--cache-profile`).

References:

- [CLI cache](./docs/cli/cache.md)
- [Cache config](./docs/config/cache.md)

## Translation and provider workflow

`generate` and `generate --resume` combine provider routing, fallback behavior, and cache reuse:

- Resume mode only fills missing/placeholder leaves.
- Per-target run status and diagnostics are available in `--json`.
- Provider attempts/fallback information can be consumed in CI.

Discover providers:

```bash
i18nprune providers
i18nprune providers --json
```

## Share ecosystem

Share/report workflows are first-class and integrated across CLI and app hosts:

- `share upload --project` prepares snapshot and uploads to worker.
- `share upload --report` uploads report documents.
- Content-hash dedup reuses ids by default; `--force` rotates ids and invalidates old links.
- Local `share.json` tracks uploaded artifacts per project.
- `share list`, `share view`, `share delete` support both human and scripted operations.
- `apps/web` consumes the same hosted snapshot/share model for browser workflows.
- `apps/workers/i18nprune` provides the hosted API routes used by CLI and web share/report flows.

Reference: [Share command](./docs/commands/share/README.md)

## Capability Matrix

| Area | Highlights |
|------|------------|
| **Validation** | Literal key checks, dynamic key site reporting, stable issue codes |
| **Extraction** | Const-map rebuild paths, binding-aware parsing, multi-line/comment handling |
| **Locale maintenance** | Topology-aware sync, metadata leaf modes, cleanup flows |
| **Translation** | Provider-backed generate, resume/top-up workflows, persisted cache reuse |
| **Caching** | Per-project analysis cache + per-target translation cache, profile tuning |
| **Automation** | Stable `--json` envelope, CI-friendly non-interactive behavior |
| **Sharing** | Hosted snapshot/report upload, hash dedup, force replace semantics |
| **Diagnostics** | `doctor`, cache diagnostics, path/env readiness checks |

## Documentation Journey

| Step | Where to go |
|------|-------------|
| Start | [Onboarding](./docs/onboarding/README.md) |
| Commands | [Commands hub](./docs/commands/README.md) |
| Config | [Config hub](./docs/config/README.md) |
| JSON + issues | [CLI JSON](./docs/cli/json.md) · [Issues](./docs/issues/README.md) |
| Deep dives | [Architecture](./docs/architecture/README.md) · [Edge cases](./docs/edge-cases/README.md) |

Hosted docs: [docs.i18nprune.dev](https://docs.i18nprune.dev) · Changelogs: [releases.i18nprune.dev](https://releases.i18nprune.dev)

## Repository Layout

| Path | Responsibility |
|------|----------------|
| `packages/core/` | Domain engine (`runXxx` ops, cache/share/runtime contracts) |
| `packages/cli/` | Command host, argv wiring, human and JSON output paths |
| `packages/ui/` | Shared runtime UI primitives used by web/report/worker docs shell |
| `apps/web/` | Shared workspace web app |
| `apps/report/` | Report web app |
| `apps/extension/` | VS Code extension host (**in development**, post-v1) |
| `apps/workers/` | Worker APIs (`i18nprune`, `meta`) |
| `docs/` | Source-of-truth markdown synced into VitePress app |

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm docs:dev
pnpm docs:build
```

## Contributing

See [Contributors guide](./docs/contributors/README.md) for setup, testing, and PR workflow.

## License

MIT — see [LICENSE](./LICENSE).
