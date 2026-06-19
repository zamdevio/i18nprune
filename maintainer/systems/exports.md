# `@i18nprune/core` export system

**Audience:** Maintainers and agents changing `packages/core` barrels, `package.json` exports, or host imports.  
**Execution sequencing + run checklist:** [`../phases/exports.md`](../phases/exports.md) (slices EX-0…EX-5).  
**Script operator manual:** [`../../scripts/exports/README.md`](../../scripts/exports/README.md) — all `pnpm exports:*` usage (canonical).  
**User-facing mirror:** [`docs/sdk/exports.md`](../../docs/sdk/exports.md) (EX-5) — under SDK docs, not `docs/exports/`.

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
| **Stability tiers** | This file + [`phases/exports.md`](../phases/exports.md) | Will this break on a minor npm bump? |
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

After [`phases/exports.md`](../phases/exports.md) EX-3:

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

**Backlog (not EX-1):** Additional domain subpaths (`/doctor`, `/share`, `/cache`, `/analysis`, …) — see [`phases/exports.md` § Recommended future subpaths](../phases/exports.md#recommended-future-subpaths-backlog).

---

## Monorepo path aliases (tsconfig vs npm exports)

**Published API** is only what `packages/core/package.json` → `exports` lists. **`tsconfig` `paths` is dev-only** but must not be more permissive than npm — otherwise monorepo code imports unpublished deep paths that external SDK users cannot use.

### Problem today

Root and `packages/core` tsconfig include:

```json
"@i18nprune/core/*": ["packages/core/src/*", "packages/core/src/*/index.ts"]
```

Any import like `@i18nprune/core/shared/constants/issueCodes.js` typechecks in the monorepo but is **not** a published export. Known violations to fix in EX-4:

| Import | Fix target |
|--------|------------|
| `@i18nprune/core/shared/constants/issueCodes.js` (CLI test) | `@i18nprune/core/issues` |
| `@i18nprune/core/shared/languages/normalize.js` (`scripts/catalog/build.ts`) | `@i18nprune/core/shared` or `/utils` / languages surface |

### Required policy (EX-4)

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

Do **not** widen `package.json` exports to match arbitrary `src/**` folders — add a subpath barrel instead ([`phases/exports.md`](../phases/exports.md)).

---

## Recommended future subpaths (backlog)

Same pattern as EX-1 tier subpaths and existing op subpaths: **full surface on subpath**, **`export * as <name>` on root only**. Not scheduled for immediate implementation — prioritize in EX-0 inventory.

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

Execution detail and overlap notes: [`phases/exports.md` § Recommended future subpaths](../phases/exports.md#recommended-future-subpaths-backlog).

---

## Root barrel rules

### Flat exports allowed on root (stable facade)

- All **`runXxx`** orchestration entrypoints
- **`resolveContext`**, **`tryResolveContext`**, **`createCoreContext`**, **`createTranslateContext`**, and other documented quick-start symbols
- Do **not** add new flat exports without updating the inventory ([`phases/exports.md`](../phases/exports.md) EX-0)

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

## CI and hygiene guards (EX-4)

| Guard | Intent |
|-------|--------|
| **tsconfig ↔ exports parity** | No `@i18nprune/core/*` wildcard; allowlist matches `package.json` |
| **Deep import grep** | Hosts must not import unpublished `@i18nprune/core/...` paths |
| Forbidden importers | `apps/extension/**`, `examples/sdk/**` must not import `/internal` |
| **`pnpm exports:validate`** | CI gate — see [`phases/exports.md`](../phases/exports.md) EX-4 + script hardening table |
| Knip | Barrel files listed in [`knip.md`](./knip.md) — do not “fix” knip by deleting public re-exports |
| Extension host size | `@i18nprune/core` externalized in esbuild — prefer subpaths over bundling root |
| No `@deprecated` | Remove export and update call sites ([`agents/rules.md`](../agents/rules.md)) |

---

## Namespace overlap cleanup

Today root and `/shared` both expose names like `json`, `scanner`, `errors`. After EX-3:

- **Domain namespaces** on root (`validate`, `generate`, …) — keep
- **Shared module namespaces** (`json`, `scanner`, …) — **`/shared` subpath only**; root exposes **`shared.*`** not duplicate top-level `scanner`

---

## Export governance scripts (`scripts/exports/`)

**Operator manual (canonical):** [`scripts/exports/README.md`](../../scripts/exports/README.md) — every `pnpm exports:*` command, flag, cache profile, output legend, and example.  
**Slice sequencing + post-refactor checklist:** [`phases/exports.md`](../phases/exports.md).

Maintainer tooling lives under **`scripts/exports/`** (same pattern as `scripts/ui/purity-check.mjs`, `scripts/catalog/`). **Not** in `packages/core` — core stays pure (no repo introspection, no `process`).

### Why it exists

The barrel refactor is mostly mechanical; the failure mode is **slow API drift** — a symbol lands on root without a tier decision. **`exports:inventory`** / **`exports:graph`** answer “what is the surface?”; **`exports:diff`** answers “what changed?”; **`exports:validate`** (EX-4 CI gate) answers “does the tree violate policy?”

**No committed inventory JSON.** Git history and `git show <sha>:packages/core/src/index.ts` are the source of truth for past states. Parsed snapshots live only in gitignored **`.exports/cache/`**.

### Layout (implementation)

```text
scripts/exports/
  run.ts                 CLI entry (tsx)
  paths.ts               SNAPSHOT_VERSION, TOOL_VERSION, CACHE_META_VERSION, subpath map
  commands/              inventory, diff, validate, trend, timeline, graph
  inventory/             parse barrel, tiers.ts, categories, graph edges
  cache/store/           read/write, meta heal, toolVersion purge
  git/                   rev-parse, git show, barrel log
  logger/, help/, time/
```

Wire: root `package.json` → `pnpm exports:<cmd>` → `tsx scripts/exports/run.ts <cmd>`.

### Cache model (rules)

| Artifact | Profile | Used by |
|----------|---------|---------|
| `<sha>/inventory.full.json` | full | inventory, diff, graph, trend, validate |
| `<sha>/timeline.summary.json` | timeline | timeline only (never loads full graph) |
| `meta.json` | index | trend heal; lists warmed full snapshots |

| Constant (`paths.ts`) | Invalidates |
|-----------------------|-------------|
| **`SNAPSHOT_VERSION`** | Snapshot JSON **shape** |
| **`TOOL_VERSION`** | Scanner **logic** (tiers, parser) — all SHAs on bump |
| **`CACHE_META_VERSION`** | `meta.json` index shape only |

**Auto-heal:** corrupt JSON, SHA mismatch, stale versions → delete file → rebuild on next access. **`--force` / `-f`** skip read and overwrite; **`--no-cache`** skip read and write. Details: [`scripts/exports/README.md` § Cache](../../scripts/exports/README.md#cache).

**`exports:validate`** always reads the **working tree** — never depends on cache being warm.

### Tier classification (in code)

Rules live in **`scripts/exports/inventory/tiers.ts`** and **`categories.ts`** (aligned with stability tiers in this doc). Bootstrap heuristics use export **names**; post–EX-1 hardening should prefer **barrel path / source module** where possible ([`phases/exports.md` § Post-refactor script hardening](../phases/exports.md#post-refactor-script-hardening-apply-during-ex-1ex-4)).

**Unclassified** at `HEAD` → **`exports:validate` fails** (EX-4).

### Command roles (summary)

| Command | Question | Fails CI? |
|---------|----------|-----------|
| **`exports:inventory`** | What does the surface look like? | No |
| **`exports:graph`** | Where do re-exports land (target subpath / module)? | No |
| **`exports:diff`** | What changed vs ref or range? | No |
| **`exports:trend`** / **`timeline`** | How did counts move across tags / barrel commits? | No |
| **`exports:validate`** | Does the working tree violate governance? | **Yes (EX-4)** |

Full flags (`-v`, `-f`, `--no-cache`, timeline ranges, etc.): **README only**.

### What `exports:validate` will enforce (EX-4)

1. **Paths parity** — tsconfig `paths` ⊆ `package.json` `exports`; no `@i18nprune/core/*` wildcard  
2. **Host imports** — allowlisted subpaths only; extension/examples ≠ `/internal`  
3. **Root barrel policy** — no flat leaks from tier subpaths (post–EX-3)  
4. **Tier rules** — zero **unclassified** symbols  
5. **Optional:** root flat count budget (post–EX-3)

### What scripts do **not** replace

| Tool | Still owns |
|------|------------|
| **knip** | Unused files / deps |
| **publish-types** | Packed tarball resolution |
| **parity tests** | CLI `--json` bytes |
| **git** | History — scripts read refs, they do not duplicate commits |

---

## Adding a new export (maintainer checklist)

1. Classify tier: stable / advanced / internal / domain-only (this doc + barrel location)
2. Add to the correct **subpath barrel**, not root flat (unless stable `runXxx`-class entry)
3. Extend **`scripts/exports/inventory/tiers.ts`** if a new pattern needs a rule
4. Run **`pnpm exports:diff`** then **`pnpm exports:validate`**
5. Update [`docs/sdk/exports.md`](../../docs/sdk/exports.md) if user-facing stable surface grows (EX-5)
6. Run `pnpm run core:build`, `pnpm typecheck`, `pnpm test`

---

## Cross-links

| Doc | Role |
|-----|------|
| [`scripts/exports/README.md`](../../scripts/exports/README.md) | **`pnpm exports:*` operator manual** (commands, cache, examples) |
| [`phases/exports.md`](../phases/exports.md) | Slice sequencing EX-0…EX-5 |
| [`operations/entrypoints.md`](./operations/entrypoints.md) | `runXxx` wiring table |
| [`knip.md`](./knip.md) | Ignored public barrels |
| [`health.md`](./health.md) | When to run core build + knip |
| [`phases/extension/core-integration.md`](../phases/extension/core-integration.md) | Extension pinned imports |
| [`docs/sdk/operations.md`](../../docs/sdk/operations.md) | Public SDK ops index |
