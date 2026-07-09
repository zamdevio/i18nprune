# `@i18nprune/core` export system

**Audience:** Maintainers and agents changing `packages/core` barrels, `package.json` exports, or host imports.  
**Execution sequencing:** [`shipped/exports/program.md`](../shipped/exports/program.md) · **Governance shipped:** [`shipped/exports/governance.md`](../shipped/exports/governance.md) · **Tier work:** [`shipped/exports/tiers.md`](../shipped/exports/tiers.md)  
**Governance tool:** [`expgov.config.ts`](../../expgov.config.ts) + **`expgov`** CLI (`@expgov/cli`). Legacy `scripts/exports/` removed — use `expgov inventory|diff|validate|graph|…`.  
**User-facing mirror:** [`docs/sdk/exports.md`](../../docs/sdk/exports.md) — stability tiers under the SDK docs tree.

---

## Purpose

`@i18nprune/core` is a **platform SDK**, not a CLI implementation detail. The export system defines:

1. **Which symbols are semver-governed**
2. **Which subpath to import for bundle size and clarity**
3. **Which hosts may use `/internal`**

Without this, every refactor asks: “Can I remove this export without breaking someone?”

---

## Two “tier” vocabularies (do not merge)

| Vocabulary | Where documented | Question it answers |
|------------|------------------|---------------------|
| **Stability tiers** | This file + [`shipped/exports/program.md`](../shipped/exports/program.md) | Will this break on a minor npm bump? |
| **Runtime Tier A / B** | [`docs/sdk/operations.md`](../../docs/sdk/operations.md) | Is it safe to call from this host (read-only vs writes)? |

---

## Stability tiers

| Tier | Subpaths | Semver | External support |
|------|----------|--------|------------------|
| **Stable SDK** | `.` (facade), `/validate`, `/sync`, `/generate`, `/init`, `/locales`, `/missing`, `/cleanup`, `/quality`, `/config`, `/runtime/*`, `/types`, `/report-schema`, **`/issues`**, **`/utils`**, **`/shared`** | Yes — additive minors post-1.0 | Fully supported |
| **Advanced** | **`/advanced`** | Yes — breaking changes require deprecation notes | Supported for power users |
| **Internal** | **`/internal`** | **No** | Published path for monorepo convenience; **unsupported** for external semver |

**Frozen integrator contracts (not the same as “every export”):**

- CLI `--json` envelope shape and `meta.apiVersion`
- Stable `issues[].code` **string values** (never rename existing codes)
- Parity sample fixture outputs where documented

---

## Subpath catalog (target state)

After root slim ([`shipped/exports/program.md`](../shipped/exports/program.md)):

| Subpath | Holds | Root namespace mirror |
|---------|-------|----------------------|
| `@i18nprune/core` | Stable **flat** entrypoints + **namespaces** only | — |
| `@i18nprune/core/validate` | Validate graph | `validate` |
| `@i18nprune/core/sync` | Sync graph | `sync` |
| `@i18nprune/core/generate` | Generate / translate graph | `generate` |
| `@i18nprune/core/init` | Init graph | `init` |
| `@i18nprune/core/locales` | Locales ops graph | `locales` |
| `@i18nprune/core/missing` | Missing graph | `missing` |
| `@i18nprune/core/cleanup` | Cleanup graph | `cleanup` |
| `@i18nprune/core/quality` | Quality graph | `quality` |
| `@i18nprune/core/config` | Schema, load, `defineConfig` | `config` |
| `@i18nprune/core/runtime/node` | Node adapters | `runtime` (partial) |
| `@i18nprune/core/runtime/web` | Web adapters | `runtime` |
| `@i18nprune/core/runtime/edge` | Edge adapters | `runtime` |
| `@i18nprune/core/runtime/helpers/sync` | Sync FS helpers | — |
| `@i18nprune/core/types` | Type barrels | — |
| `@i18nprune/core/report-schema` | Report Zod schema | — |
| **`@i18nprune/core/issues`** | `ISSUE_*`, issue types, doc-link helpers | **`issues`** |
| **`@i18nprune/core/utils`** | Pure helpers (json path, clone, …) | **`utils`** |
| **`@i18nprune/core/shared`** | i18n cross-cutting modules (scanner, locale IO, placeholders, run emitters, constants) | **`shared`** |
| **`@i18nprune/core/advanced`** | Translator policy, provider health, patching analyze, … | **`advanced`** |
| **`@i18nprune/core/internal`** | Envelope glue, concurrency internals, host wiring | **`internal`** |

Op subpaths exist for **bundle graphs**; tier subpaths exist for **API governance**. Both stay.

**Backlog:** Additional domain subpaths — see [`shipped/exports/program.md` § Recommended future subpaths](../shipped/exports/program.md#recommended-future-subpaths-backlog).

---

## Monorepo path aliases (tsconfig vs npm exports)

**Published API** is only what `packages/core/package.json` → `exports` lists. **`tsconfig` `paths` is dev-only** but must not be more permissive than npm — otherwise monorepo code imports unpublished deep paths that external SDK users cannot use.

### Problem today

Root and `packages/core` tsconfig include:

```json
"@i18nprune/core/*": ["packages/core/src/*", "packages/core/src/*/index.ts"]
```

Known violations to fix during host migration / CI hardening:

| Import | Fix target |
|--------|------------|
| `@i18nprune/core/shared/constants/issueCodes.js` (CLI test) | `@i18nprune/core/issues` |
| `@i18nprune/core/shared/languages/normalize.js` (`scripts/catalog/build.ts`) | `@i18nprune/core/shared` or `/utils` / languages surface |

### Required policy

| Rule | Detail |
|------|--------|
| **No wildcard** | Remove `@i18nprune/core/*` from tsconfig |
| **Explicit allowlist** | Each `paths` key matches a `package.json` `exports` key exactly |
| **Dual update** | New subpath → tsup + `exports` + tsconfig in same PR |
| **Host imports** | `packages/cli`, `apps/*`, `examples/*`, `scripts/*` may only use allowlisted subpaths + root |
| **Inside core** | Relative imports only — no `@i18nprune/core/...` self-imports |

```text
tsconfig paths  ⊆  package.json exports keys  ⊆  intentional public API
```

Do **not** widen `package.json` exports to match arbitrary `src/**` folders — add a subpath barrel instead ([`shipped/exports/program.md`](../shipped/exports/program.md)).

---

## Recommended future subpaths (backlog)

Same pattern as tier subpaths and existing op subpaths: **full surface on subpath**, **`export * as <name>` on root only**.

| Candidate | Root namespace | Rationale | Priority |
|-----------|----------------|-----------|----------|
| `/doctor` | `doctor` | `runDoctor`; worker + CLI parity | High |
| `/review` | `review` | `runReview`; worker route | High |
| `/share` | `share` | `runShare*`; web/report hosts | High |
| `/report` | `report` | `runReport`, HTML render — vs `/report-schema` (schema only) | High |
| `/translate` | `translator` or `translate` | `runTranslate` graph; decide overlap with `/generate` | Medium |
| `/cache` | `cache` | Cache config + project disk introspection | Medium |
| `/analysis` | `analysis` | Project analysis / key-site reads; extension WI | Medium |
| `/patching` | `patching` | `runPatching`, patch plans | Medium |
| `/extractor` | `extractor` | Static extraction; extension/worker | Medium |
| `/suggestions` | `suggestions` | Locale suggestions — or fold into `/locales` | Low |

**Not candidates:** per-file subpaths under `shared/` (`/json`, `/scanner`, …) — use **`/shared`** + root `shared.*`.

Execution detail: [`shipped/exports/program.md` § Recommended future subpaths](../shipped/exports/program.md#recommended-future-subpaths-backlog).

---

## Root barrel rules

### Flat exports allowed on root (stable facade)

- All **`runXxx`** orchestration entrypoints
- **`resolveContext`**, **`tryResolveContext`**, **`createCoreContext`**, **`createTranslateContext`**, and other documented quick-start symbols
- Do **not** add new flat exports without running `expgov inventory` ([`shipped/exports/governance.md`](../shipped/exports/governance.md))

### Namespace exports on root

**Domain namespaces** (existing):

```ts
import { validate, runValidate } from '@i18nprune/core';
validate.buildValidateIssues(...);
runValidate(...);
```

**Subpath mirrors** (namespace only — no flat duplicates):

```ts
import { issues, utils, shared, advanced, internal } from '@i18nprune/core';

issues.ISSUE_VALIDATE_MISSING_LITERAL_KEYS;
utils.getAtPath(obj, 'a.b');
shared.scanner.listSourceFiles(...);
advanced.resolveTranslator(...);  // advanced tier
internal.buildCliJsonEnvelope(...);  // unsupported external semver
```

### Forbidden on root

- Flat exports from `/internal`, `/advanced`, `/shared`, `/issues`, `/utils`
- Bulk `export * from './shared/...'` cherry-picks
- Re-exporting `/internal` or `/advanced` flats “for convenience”

---

## Subpath barrel rules

Each tier subpath barrel may use **namespace + flat** (same ergonomics as today’s domain namespaces):

```ts
// @i18nprune/core/issues — full surface here
export * as codes from './codes.js';
export { ISSUE_VALIDATE_MISSING_LITERAL_KEYS, ... } from './codes.js';
export { issueCodeDocHref, ... } from './docLinks.js';
```

Root only gets `export * as issues from './exports/issues.js'`.

**Build wiring:** root and subpath barrels import from **source paths** inside `packages/core/src/` — never `from '@i18nprune/core/internal'` (self-import cycles in tsup).

---

## `/issues` vs domain builders

| Layer | Location | Examples |
|-------|----------|----------|
| Vocabulary | `/issues` | `ISSUE_*`, `Issue` types, `issueCodeDocHref` |
| Construction | Domain subpath / namespace | `buildValidateIssues`, `issuesFromSourcePlaceholderLeaves` |
| Presentation glue | `/internal` | `buildCliJsonEnvelope`, `stringifyEnvelope` |

Domain builders **import codes** from `/issues`; they do not live on `/issues`.

---

## `/utils` vs `/shared` vs `/internal`

| Subpath | Criterion | Examples |
|---------|-----------|----------|
| **`/utils`** | Pure, stateless, no i18n meaning | `getAtPath`, `deepClone`, `splitPath` |
| **`/shared`** | Cross-cutting i18n modules | `scanner`, locale read/write, placeholders, `noopRunEmitter` |
| **`/internal`** | Host glue, orchestration internals | `buildCliJsonEnvelope`, `mapWithConcurrency`, identity-streak state |

If a symbol is both pure and i18n-specific, it belongs on **`/shared`** or a domain subpath — not `/utils`.

---

## Host import matrix

| Host | Stable + op subpaths | `/issues` `/utils` `/shared` | `/advanced` | `/internal` |
|------|---------------------|-------------------------------|-------------|-------------|
| `packages/cli` | Yes | Yes | Yes | **Yes** |
| `apps/workers/*` | Yes | Yes | When needed | Avoid |
| `apps/web`, `apps/report` | Yes | Yes | When needed | Avoid |
| `apps/extension` | Yes | Yes | Rarely | **No** |
| `examples/sdk/**` | Yes | Yes | Yes | **No** |
| External npm users | Yes | Yes | Yes | At own risk (unsupported) |

**Default for new code:** smallest subpath that fits. Root namespace is for ergonomics, not bundled production graphs.

```ts
// Preferred (extension, workers, bundled hosts)
import { runValidate } from '@i18nprune/core/validate';
import { ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED } from '@i18nprune/core/issues';

// Acceptable (scripts, quick starts)
import { runValidate, issues } from '@i18nprune/core';
```

---

## Build and publish artifacts

| Step | Command / file |
|------|----------------|
| Core build | `pnpm run core:build` → `tsup` + DTS fix + report copy |
| Subpath entries | `packages/core/tsup.config.ts` → `subpathEntries` |
| Export map | `packages/core/package.json` → `exports` |
| Typecheck gate | `pnpm typecheck` depends on `@i18nprune/core#build` ([`ci.md`](./ci.md)) |
| Publish smoke | `tests/publish-types`, `publish:verify` |

New subpaths require: source barrel → tsup entry → `package.json` exports → README table row.

---

## CI and hygiene guards

| Guard | Intent |
|-------|--------|
| **tsconfig ↔ exports parity** | No `@i18nprune/core/*` wildcard; allowlist matches `package.json` |
| **Deep import grep** | Hosts must not import unpublished `@i18nprune/core/...` paths |
| Forbidden importers | `apps/extension/**`, `examples/sdk/**` must not import `/internal` |
| **`expgov validate`** | CI gate — see [`shipped/exports/program.md`](../shipped/exports/program.md) |
| Knip | Barrel files listed in [`knip.md`](./knip.md) — do not “fix” knip by deleting public re-exports |
| Extension host size | `@i18nprune/core` externalized in esbuild — prefer subpaths over bundling root |
| No `@deprecated` | Remove export and update call sites ([`agents/rules.md`](../agents/rules.md)) |

---

## Namespace overlap cleanup

Today root and `/shared` both expose names like `json`, `scanner`, `errors`. After root slim:

- **Domain namespaces** on root (`validate`, `generate`, …) — keep
- **Shared module namespaces** (`json`, `scanner`, …) — **`/shared` subpath only**; root exposes **`shared.*`** not duplicate top-level `scanner`

---

## Export governance (expgov)

**Config:** [`expgov.config.ts`](../../expgov.config.ts) · **CI:** [`.github/workflows/exports.yml`](../../.github/workflows/exports.yml) · **Workstreams:** [`shipped/exports/program.md`](../shipped/exports/program.md)

Run from repo root:

```bash
expgov inventory -v
expgov graph -v
expgov diff HEAD
expgov validate          # CI gate
expgov suggest -T 20
```

Cache: gitignored **`.exports/cache/<sha>/`**. Legacy `scripts/exports/` was removed — do not reintroduce.

**Unclassified** symbols at `HEAD` → **`expgov validate` fails**.

---

## Adding a new export (maintainer checklist)

1. Classify tier: stable / advanced / internal / domain-only (this doc + barrel location)
2. Add to the correct **subpath barrel**, not root flat (unless stable `runXxx`-class entry)
3. Update **`expgov.config.ts`** tier rules or add `@sdkTier` on the defining export
4. Run **`expgov diff HEAD`** then **`expgov validate`**
5. Update [`docs/sdk/exports.md`](../../docs/sdk/exports.md) when user-facing stable surface grows
6. Run `pnpm run core:build`, `pnpm typecheck`, `pnpm test`

---

## Cross-links

| Doc | Role |
|-----|------|
| [`shipped/exports/governance.md`](../shipped/exports/governance.md) | Shipped governance + publish preflight |
| [`shipped/exports/program.md`](../shipped/exports/program.md) | Barrel refactor workstreams |
| [`shipped/exports/tiers.md`](../shipped/exports/tiers.md) | Honest tier classification |
| [`operations/entrypoints.md`](./operations/entrypoints.md) | `runXxx` wiring table |
| [`knip.md`](./knip.md) | Ignored public barrels |
| [`health.md`](./health.md) | When to run core build + knip |
| [`phases/extension/core-integration.md`](../phases/extension/core-integration.md) | Extension pinned imports |
| [`docs/sdk/operations.md`](../../docs/sdk/operations.md) | Public SDK ops index |
