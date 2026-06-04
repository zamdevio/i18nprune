# Changelog

User-visible release history for [i18nprune](https://i18nprune.dev). Newest releases first.

---

## v0.1.0 — 2026-06-02

First public release: **CLI** on npm as [`i18nprune`](https://www.npmjs.com/package/i18nprune) and optional **SDK** as [`@i18nprune/core`](https://www.npmjs.com/package/@i18nprune/core). Requires **Node.js >= 18**.

### Highlights

- **CLI** — `init`, `validate`, `sync`, `generate` (with `--resume`), `missing`, `quality`, `review`, `cleanup`, `doctor`, `report`, `share`, and `locales` subcommands with stable **`--json`** output and issue codes for CI.
- **Locale layouts** — `flat_file`, `locale_directory` with `locale_per_dir` or `feature_bundle`; schema-first sync and metadata leaf modes. See [Locales config](./config/locales.md).
- **Translation** — Multiple providers, persisted per-target cache, cache profiles (`safe` | `balanced` | `fast`). See [Generate](./commands/generate/README.md) and [CLI cache](./cli/cache.md).
- **Share & report** — Upload project snapshots and report JSON to hosted workers; open links in the web workspace and report viewer. See [Share](./commands/share/README.md).
- **SDK** — Runtime-neutral `runXxx` entry points, Node/web/edge adapters, and granular subpath imports (`/validate`, `/sync`, `/generate`, `/config`, …). See [SDK operations](./sdk/operations.md) and [Runtime](./runtime/README.md).
- **Report schema** — `ProjectReportDocument` validation via `@i18nprune/core/report-schema` (same shape as `i18nprune report --format json`). See [Report payload](./report/payload.md).
- **Cross-platform** — Linux, macOS, and Windows paths and cache home (`I18NPRUNE_HOME`) documented and CI-guarded.

### npm packages

| Package | Install | Notes |
|---------|---------|--------|
| `i18nprune` | `npm install -g i18nprune` | Bundled CLI + `i18nprune/core` programmatic subpath |
| `@i18nprune/core` | `npm install @i18nprune/core` | Standalone SDK with `dist/` subpath exports |

### Documentation

- Site: [docs.i18nprune.dev](https://docs.i18nprune.dev)
- Start: [Onboarding](./onboarding/README.md) · [Commands](./commands/README.md) · [CLI JSON](./cli/json.md)

### Not in this release

- **VS Code extension** — planned post-v1; same engine and `--json` contracts ([README](../README.md#vs-code-extension-in-development)).

### Migration notes

- **First install** — no upgrade path from a prior published line; use `i18nprune init` and [Quick start](../README.md#quick-start).
- **`generate --resume`** — replaces the removed `fill` command; see [Generate](./commands/generate/README.md).
- **Monorepo / SDK consumers** — report schema imports use `@i18nprune/core/report-schema` (not a separate schema package).

### Links

- [Architecture hub](./architecture/README.md)
- [Issues registry](./issues/README.md)
- [Edge cases](./edge-cases/README.md)

---

## How we maintain this file

- One section per release (`## vX.Y.Z — date`).
- User-facing changes first; migration and breaking notes when relevant.
- Optional mirror for the marketing site: `apps/web` `/changelog` data (when that route ships).
