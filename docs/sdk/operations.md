# SDK operations

Programmatic entry points for `@i18nprune/core`. Each **`runXxx`** function mirrors a CLI command’s engine logic; hosts supply **runtime adapters** and optional **hooks** for progress, prompts, and filesystem access.

## Mental model

```text
resolveContext({ projectRoot, adapters })  →  CoreContext
runXxx(ctx, options, hostHooks?)           →  { payload, issues, … }
```

- **Core** owns deterministic analysis, locale IO plans, and typed results.
- **CLI / your host** owns envelopes, exit codes, human stderr, and adapter construction.
- **Tier A** — read / analyze only (safe in browser and edge bundles).
- **Tier B** — may write locale files or mutate project state (expect Node or a backend you operate).

See [Runtime-neutral SDK host model (ADR 011)](../architecture/decisions/011-runtime-neutral-sdk-host-model.md) and [Runtime overview](../runtime/README.md).

## Host setup (Node)

```ts
import { resolveContext, runValidate } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

const ctx = await resolveContext({
  projectRoot: process.cwd(),
  adapters: createNodeRuntimeAdapters(),
});

const result = await runValidate(ctx, {});
// result.payload · result.issues
```

Web and edge adapters: `@i18nprune/core/runtime/web`, `@i18nprune/core/runtime/edge`.

Runnable scripts: [SDK examples](../examples/sdk.md).

## Operations index

| Operation | Core entry | Tier | Example | CLI `--json` |
|-----------|------------|------|---------|--------------|
| validate | `runValidate` | A | — | yes |
| doctor | `runDoctor` | A | [doctor](../../examples/sdk/doctor/runDoctor.ts) | yes |
| missing | `runMissing` | B | [missing](../../examples/sdk/missing/runMissing.ts) | yes |
| sync | `runSync` | B | [sync](../../examples/sdk/sync/runSync.ts) | yes |
| cleanup | `runCleanup` | B | — | yes |
| quality | `runQuality` | A | [quality](../../examples/sdk/quality/runQuality.ts) | yes |
| review | `runReview` | A | [review](../../examples/sdk/review/runReview.ts) | yes |
| generate | `runGenerate` | B | [generate](../../examples/sdk/generate/runGenerate.ts) | yes |
| translate (provider) | `runTranslate` | B | [translate](../../examples/sdk/translate/runTranslate.ts) | via generate path |
| report | `runReport` | A | — | yes ([dual JSON](../cli/json.md#report-json-vs-cli-json)) |
| share upload | `runShare` | A | — | yes |
| share list | `runShareList` | A | [share list](../../examples/sdk/share/runShareList.ts) | yes |
| share view | `runShareView` | A | — | yes |
| share delete | `runShareDelete` | A | — | yes |
| locales list | `runLocalesList` | A/B | — | yes |
| locales dynamic | `runDynamic` | A | — | yes |
| locales delete | `deleteLocaleFiles` | B | — | yes |
| init | `runInit` | B | — | partial / host-specific |
| patching | `runPatching` | B | — | CLI-first today |
| project readiness | `runProjectReadiness` | A | — | used by doctor / CI presets |

### CLI envelope wrappers (import from CLI, not core)

These commands assemble the **`CliJsonEnvelope`** in the CLI package even though core owns most payloads:

| CLI command | Notes |
|-------------|--------|
| `validate --json` | Core `runValidate`; CLI adds envelope + exit code |
| `languages --json` | Locale catalog envelope |
| `config --json` | Resolved config snapshot |
| `providers --json` | Translation provider list |

SDK integrators should call the matching **`runXxx`** in core when one exists, or spawn the CLI for envelope-only commands.

## Return shape (sketch)

Most **`runXxx`** results follow:

```ts
type RunResult = {
  payload: /* command-specific JSON data */;
  issues: Issue[];  // stable codes: i18nprune.*
  ok?: boolean;       // some ops expose explicitly
};
```

Long-running ops (`runGenerate`, `runTranslate`) accept **host hooks** for `run.progress.*` events. Progress UX is host-owned; semantics stay in core. See [generate](../commands/generate/README.md).

Async / IO-heavy: `runGenerate`, `runReport`, `runShare`, `runSync`, `runMissing`, `runCleanup`, `runInit`.

## Exports and subpaths

Install:

```bash
npm i @i18nprune/core
```

### Root barrel (`@i18nprune/core`)

Primary **`runXxx`** exports, analysis helpers (`resolveProjectAnalysis`, `scanProjectLiteralKeyUsage`), share/report builders, translator utilities, and shared types.

### Published subpaths

| Subpath | Use for |
|---------|---------|
| `@i18nprune/core` | Default — `runXxx`, context, analysis |
| `@i18nprune/core/config` | `defineConfig`, `I18nPruneConfig` |
| `@i18nprune/core/runtime/node` | `createNodeRuntimeAdapters` |
| `@i18nprune/core/runtime/web` | `createWebRuntimeAdapters` |
| `@i18nprune/core/runtime/edge` | `createEdgeRuntimeAdapters` |
| `@i18nprune/core/validate` | Validate-only graph (smaller bundle) |
| `@i18nprune/core/sync` | Sync-only graph |
| `@i18nprune/core/missing` | Missing-only graph |
| `@i18nprune/core/cleanup` | Cleanup-only graph |
| `@i18nprune/core/quality` | Quality-only graph |
| `@i18nprune/core/generate` | Generate / translate graph |
| `@i18nprune/core/init` | Init scaffolding |
| `@i18nprune/core/locales` | Locale list / dynamic helpers |
| `@i18nprune/core/shared` | Shared constants and helpers |
| `@i18nprune/core/types` | Type-only imports |
| `@i18nprune/core/report-schema` | Report document Zod schema |

Type namespaces on the root barrel (e.g. `keySites`, `extractor`, `share`) mirror core modules for tree-shaking-friendly imports.

Configuration types and **`defineConfig`**: [Configuration](../config/README.md).

## JSON contract parity

CLI **`--json`** envelopes use stable **`issues[].code`** values and **`meta.apiVersion`** (envelope contract, currently `"1"` — independent of npm semver). See [JSON output](../cli/json.md).

## Known extraction limits

Static analysis is heuristic, not full TypeScript semantics. Patterns such as **`const { t } = useTranslation()`** (hook destructuring) may not resolve today. See [Regex and static-analysis limits](../architecture/extraction/regex.md) and the [unsolved inventory](../edge-cases/unsolved/inventory.md).

## Related

- [SDK onboarding](../onboarding/sdk.md)
- [SDK examples](../examples/sdk.md)
- [CLI commands](../commands/README.md)
- [Architecture overview](../architecture/README.md)
- [ADR 006 — Command orchestrator boundary](../architecture/decisions/006-command-orchestrator-boundary.md)
- [ADR 011 — Runtime-neutral SDK host model](../architecture/decisions/011-runtime-neutral-sdk-host-model.md)
