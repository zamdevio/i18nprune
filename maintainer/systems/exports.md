# `@i18nprune/core` export system

**Audience:** Maintainers and agents changing `packages/core` barrels, `package.json` exports, or host imports.  
**Execution sequencing:** [`../phases/exports.md`](../phases/exports.md) (slices EX-0…EX-5).  
**Script operator manual:** [`../../scripts/exports/README.md`](../../scripts/exports/README.md) — commands, flags, cache layout, examples (canonical for `pnpm exports:*`).  
**User-facing mirror:** `docs/exports/README.md` (EX-5).

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
| **`pnpm exports:validate`** | CI gate — structural rules + paths + host imports (see [`exports.md`](./exports.md)) |
| Knip | Barrel files listed in [`knip.md`](./knip.md) — do not “fix” knip by deleting public re-exports |
| Extension host size | `@i18nprune/core` externalized in esbuild — prefer subpaths over bundling root |
| No `@deprecated` | Remove export and update call sites ([`agents/rules.md`](../agents/rules.md)) |

---

## Namespace overlap cleanup

Today root and `/shared` both expose names like `json`, `scanner`, `errors`. After EX-3:

- **Domain namespaces** on root (`validate`, `generate`, …) — keep
- **Shared module namespaces** (`json`, `scanner`, …) — **`/shared` subpath only**; root exposes **`shared.*`** not duplicate top-level `scanner`

---

## Export validation scripts (`scripts/exports/`)

**Yes — put tooling here.** Same pattern as [`scripts/ui/purity-check.mjs`](../../scripts/ui/purity-check.mjs) (guard) and [`scripts/catalog/`](../../scripts/catalog/) (domain pipeline): maintainer-facing scripts under `scripts/exports/`, wired from root `package.json`, spec in this file.

**Not** under `packages/core` (core stays pure — no `process`, no repo introspection). **Not** only in `tests/` — this is ongoing governance, not a one-off fixture test (though add Vitest for parsers if useful).

### Why export scripts matter

The export refactor is mostly mechanical; the **real failure mode** is slow API drift — someone adds `export { buildEnvelope } from './foo'` to root without noticing. **`exports:validate`** (CI) + **`exports:diff`** (review) turn that into a 2-second answer instead of reading barrels at 2 AM.

**No committed inventory JSON.** Git history, tags, and **`git show <sha>:…`** are the source of truth for past states. The scripts **parse barrels** at `HEAD`, at a ref, or from the working tree; results live in **ignored** `.exports/cache/` only.

### Storage model

| Location | Git | Role |
|----------|-----|------|
| **`scripts/exports/`** | Tracked | Parsers, tier rules, validate, diff, cache heal |
| **`.exports/`** | **Ignored** | Generated snapshots per commit SHA + cache index |
| **`packages/core/src/**` barrels** | Tracked | Actual API — history via normal commits |

```text
.exports/
  cache/
    meta.json                    # index of all <sha>/ entries (auto-healed)
    <sha>/
      inventory.generated.json   # parsed exports + tier + summary at that commit
  worktrees/<sha>/               # optional — git worktree fallback only
```

**Cache behavior:** resolving a ref writes snapshots under `.exports/cache/` (gitignored, auto-healed). Nothing in `maintainer/systems/` or the repo tree is regenerated or committed by these commands.

### Cache index (`cache/meta.json`)

Single index file listing every warmed SHA directory. Updated whenever a snapshot is built or healed.

```json
{
  "version": 1,
  "toolVersion": 1,
  "entries": {
    "abc123…": {
      "requestedRefs": ["v0.2.0", "main"],
      "generatedAt": "2026-06-15T12:00:00.000Z",
      "summary": { "rootFlat": 342, "stable": 280, "advanced": 0, "internal": 0 }
    }
  }
}
```

**Auto-heal (same posture as project disk cache — see [`cache.md`](./cache.md)):** cache problems should **recover**, not block maintainers when fixable.

| Condition | Behavior |
|-----------|----------|
| `meta.json` missing | Rebuild from existing `<sha>/` dirs that have valid `inventory.full.json` |
| `<sha>/` on disk but missing from meta | Add entry from dir contents |
| Meta entry but dir missing / corrupt JSON | Drop meta row; regenerate on next `exports:diff` for that ref |
| Partial write / truncated file | Delete bad artifact; regenerate from `git show` |
| **`--no-cache`** | Skip read/write for this run; still use git |

**`exports:validate`** always parses the **working tree** (and host imports) — never depends on cache being warm.

### Tier classification (in code, not JSON)

Tiers come from **`scripts/exports/inventory/tiers.ts`** (rules aligned with this doc): barrel path, subpath entry file, root flat vs namespace, post–EX-3 layout. Examples:

- Symbol re-exported only from `src/exports/internal.ts` → **internal**
- `runXxx` on root flat → **stable**
- `ISSUE_*` from issues barrel → **stable** on `/issues`

**Unclassified** = rule table could not assign a tier → **`exports:validate` fails** (fix rules or barrel layout).

### How refs are read

| Step | Mechanism |
|------|-----------|
| Resolve ref | `git rev-parse ref^{commit}` → cache key `<sha>` |
| Sources at ref | **`git show <sha>:packages/core/src/...`** per barrel file (default) |
| Heavy fallback | `git worktree add .exports/worktrees/<sha> <sha> --detach` |
| Range `A..B` | Resolve both SHAs; diff two cached/generated snapshots |

No copying the repo to `/tmp` — worktrees stay under ignored `.exports/`.

### Root scripts (EX-0 shipped)

**Operator reference:** [`scripts/exports/README.md`](../../scripts/exports/README.md) — full command list, flags, cache profiles, output legends.

| Script | Args | Fails? | Role |
|--------|------|--------|------|
| **`pnpm exports:inventory`** | optional `[ref]` | No | Root/tier summary; `-v` symbol table |
| **`pnpm exports:diff`** | `[ref\|A..B]`, `--no-cache`, `-v` | No | Flat export delta between refs |
| **`pnpm exports:validate`** | `-v`, `--since=` | **Yes** (stub until EX-4) | tsconfig ↔ exports parity + unclassified gate |
| **`pnpm exports:trend`** | `--tags=`, `-v` | No | Per-tag flat/stable/advanced/internal |
| **`pnpm exports:timeline`** | range, `--limit=` (`0` = none), `-v` | No | Barrel-touching commits + flat Δ |
| **`pnpm exports:graph`** | `[ref]`, `-v` | No | Re-export map (subpaths + modules) |
| **`pnpm exports:help`** | topic | No | Usage |

```text
scripts/exports/
  run.ts              CLI entry
  README.md           operator manual (start here for pnpm exports:*)
  commands/           inventory, diff, validate, trend, timeline, graph
  inventory/          parse barrels, tiers, categories, graph edges
  cache/store/        meta.json heal + inventory.full.json + timeline.summary.json
  git/                ref resolve, git show, session timing stats
  logger/             output + column legends
  help/               --help text
  time/               timeline range tokens (@4w, ISO week, …)
```

Wire: `tsx --tsconfig tsconfig.json scripts/exports/run.ts <command>`. Cache root: **`.exports/cache/`** (gitignored). Optional **`//#exports:validate`** in typecheck after EX-4.

### Command progression (supported roadmap)

Build in order — each step is useful alone (ChatGPT “maintainer happiness” arc, scoped to what we need):

#### Phase 1 — `exports:inventory` (EX-0)

```bash
pnpm exports:inventory
pnpm exports:inventory HEAD
```

```text
@i18nprune/core export surface (HEAD)

  root flat:   342
  stable:      280
  advanced:      0
  internal:      0
  unclassified:  0
```

Optional `--verbose`: symbol → tier → subpath table.

#### Phase 2 — `exports:diff` (EX-0 / EX-4)

```bash
pnpm exports:diff                  # working tree vs HEAD
pnpm exports:diff main             # vs main
pnpm exports:diff v0.2.0           # vs tag (uses cache/<sha>/)
pnpm exports:diff v0.1.0..HEAD     # range
pnpm exports:diff v0.2.0 --no-cache
```

```text
Export surface delta (v0.2.0 → working tree)

  root flat:   412 → 87
  stable:      380 → 298

Added:
  + runDoctor
  + ISSUE_XYZ

Removed:
  - oldFoo

✓ No tier violations (or list violations)
```

#### Phase 3 — `exports:validate` (EX-4)

```bash
pnpm exports:validate
pnpm exports:validate --since=HEAD~1
```

```text
✓ tsconfig paths match package.json exports
✓ No forbidden host imports
✓ No internal/advanced root flat leaks
✓ root flat count within budget
```

#### Phase 4 — `exports:trend` / `exports:timeline` / `exports:graph` (EX-0)

Shipped with EX-0 (see [`scripts/exports/README.md`](../../scripts/exports/README.md)):

- **`exports:trend`** — root counts per `v*` tag; uses `cache/meta.json` + full snapshots
- **`exports:timeline`** — commits that **edit** `packages/core/src/index.ts` only; **`timeline.summary.json`** cache profile; **`Δ`** = flat change vs row above
- **`exports:graph`** — target subpath groups, namespace → source module, top edge modules

#### Phase 5 — defer

### Diff vs validate

| Command | Question | Fails CI? |
|---------|----------|-----------|
| **`exports:inventory`** | “What does the surface look like?” | No |
| **`exports:diff`** | “What changed vs ref / range?” | No (`--strict` optional later) |
| **`exports:validate`** | “Does current tree violate governance rules?” | **Yes** |

### What `exports:validate` checks

1. **Paths parity** — tsconfig ⊆ `package.json` exports; no wildcard  
2. **Host imports** — allowlisted subpaths; extension/examples ≠ `/internal`  
3. **Root barrel policy** — no flat leaks from tier subpaths (post–EX-3 rules)  
4. **Tier rules** — no **unclassified** symbols at `HEAD`  
5. **Optional:** root flat count budget (post–EX-3)

### What `exports:inventory` parses

**Where:** `packages/core/src/index.ts`, subpath barrels, `src/shared/index.ts` (AST via `ts-morph` or TS API).

**At `HEAD`:** read working tree (includes uncommitted changes — intentional for pre-push).

**At ref:** `git show` + cache, or `--no-cache` fresh parse.

Per-symbol generated shape inside **`cache/<sha>/inventory.full.json`** (full profile) or **`timeline.summary.json`** (timeline profile) — not committed.

**Cache profiles:** full commands write/read **`inventory.full.json`**; timeline writes/read **`timeline.summary.json`** only so analytics never load 500KB full graphs. See [`scripts/exports/README.md` § Cache](../../scripts/exports/README.md#cache).

### CI placement

| Option | When |
|--------|------|
| **`pnpm exports:validate` in CI verify** | EX-4 — required |
| **`//#exports:validate` in typecheck** | After script is stable |
| **`exports:diff` in CI** | Optional informational job — not required for green |

### What this does **not** replace

| Tool | Still owns |
|------|------------|
| **knip** | Unused files/deps |
| **publish-types** | Packed tarball `tsc` |
| **parity tests** | CLI `--json` bytes |
| **git history** | When/API changed over time — scripts **read** git, don’t duplicate it |

---

## Adding a new export (maintainer checklist)

1. Classify tier: stable / advanced / internal / domain-only (this doc + barrel location)
2. Add to the correct **subpath barrel**, not root flat (unless stable `runXxx`-class entry)
3. Extend **`scripts/exports/inventory/tiers.ts`** if a new pattern needs a rule
4. Run **`pnpm exports:diff`** then **`pnpm exports:validate`**
5. Update `docs/exports/README.md` if user-facing stable surface grows (EX-5)
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
