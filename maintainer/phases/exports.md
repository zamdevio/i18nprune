# Phase — `@i18nprune/core` export tiers

**Status:** **EX-0 shipped** (scripts + cache); **EX-1…EX-5 planned** — major breaking refactor on `@i18nprune/core` semver.  
**Engineering map:** [`../systems/exports.md`](../systems/exports.md) (durable rules, host matrix, barrel patterns).  
**User-facing mirror (EX-5):** `docs/exports/README.md`.

**Goal:** Split the root barrel into **stability tiers** with dedicated subpaths, keep root as a **trim facade** (stable flat entrypoints + namespace mirrors), and migrate monorepo hosts via **import path adjustments only** — no CLI `--json`, issue code string, or envelope behavior changes.

---

## Why now

`packages/core/src/index.ts` is an SDK surface definition (~1,000+ exported symbols). Everything looks equally public, but only some symbols are semver-governed integrator contracts. Subpaths for ops (`/validate`, `/generate`, …) already exist for bundle size; the root barrel still re-exports most of `shared/` and advanced/internal helpers, defeating both goals.

This phase adds **`/issues`**, **`/utils`**, **`/advanced`**, **`/internal`**, slims root, and documents who may import what.

---

## Terminology (do not confuse)

| Name | Doc | Meaning |
|------|-----|---------|
| **Stability tiers** | This phase + [`systems/exports.md`](../systems/exports.md) | Semver / support promise (stable, advanced, internal) |
| **Runtime Tier A / B** | [`docs/sdk/operations.md`](../../docs/sdk/operations.md) | Read-only vs may-write host safety |

---

## Target model (summary)

| Subpath | Stability | Flat exports on root? | Namespace on root? |
|---------|-----------|----------------------|-------------------|
| `.` (root) | Stable facade | **`runXxx`**, context factories only | Domain ops + `issues`, `utils`, `shared`, `advanced`, `internal` |
| `/validate`, `/sync`, `/generate`, … | Stable | No (use subpath or domain namespace) | Domain namespaces stay on root (`validate`, …) |
| `/config`, `/runtime/*`, `/types`, `/report-schema` | Stable | No | — |
| **`/issues`** | Stable | No | **`issues`** |
| **`/utils`** | Stable | No | **`utils`** |
| **`/shared`** | Stable (i18n cross-cutting) | No | **`shared`** |
| **`/advanced`** | Advanced (deprecation policy) | No | **`advanced`** |
| **`/internal`** | No semver guarantee | No | **`internal`** |

**Subpath rule:** each subpath keeps **full** surface (flat + nested namespaces as defined in its barrel). Root re-exports subpaths as **`export * as <name>` only** — never flat duplicates from `/internal`, `/advanced`, `/shared`, `/issues`, or `/utils`.

**Promote subpaths** in docs, examples, extension, and new host code. Root remains for quick starts and scripts.

---

## Locked splits

### `/issues` (stable)

**Move here:**

- All `ISSUE_*` string constants
- Issue-related types (unless already canonical under `/types`)
- Doc-link helpers: `issueCodeDocHref`, `issueCodeRepoDocPathForIssueCode`, `resolveIssueCodeDocLink`, `enrichIssuesWithDocHrefs`, `normalizeRepoDocPath`, …

**Do not move here:**

- Domain issue **builders** (`buildValidateIssues`, `issuesFromSourcePlaceholderLeaves`, …) — stay on `/validate`, `/sync`, etc.; they import codes from `/issues`

### `/utils` (stable)

Pure, stateless helpers — no i18n semantics, no IO, no adapters. Initial candidates (inventory finalizes):

- `getAtPath`, `setAtPath`, `deleteAtPath`, `splitPath`
- `deepClone`
- Other small pure helpers currently re-exported from root/`/shared` with no domain meaning

### `/shared` (stable)

Cross-cutting **i18n** modules: scanner, locale read/write, placeholders, run emitters, constants namespace, etc. Stop cherry-picking bulk `shared/*` onto root; **`/shared` is the primary home**.

### `/advanced` (advanced)

Power-user engine hooks: translator policy/resolvers, provider health, patching analyze, cache introspection helpers, custom provider surfaces, etc.

### `/internal` (unsupported external semver)

Host glue and orchestration internals: `buildCliJsonEnvelope`, `stringifyEnvelope`, `mapWithConcurrency`, identity-streak state helpers, other CLI-only wiring.

---

## Release

- Bump **`@i18nprune/core` major** when EX-3 lands (root slimming).
- Land monorepo host import fixes in the **same merge window** (workspace `workspace:*` makes this practical).
- **Frozen (unchanged):** CLI `--json` envelope shape, `issues[].code` **strings**, exit-code parity, issue code rename policy in workspace rules.

---

## Slices

Status: **planned** | **in progress** | **done**

| Slice | Focus | Depends on | Status |
|-------|--------|------------|--------|
| **EX-0** | Export inventory + **`scripts/exports/`** bootstrap | — | **done** |
| **EX-1** | New subpath barrels + `package.json` / tsup | EX-0 | planned |
| **EX-2** | Migrate monorepo hosts | EX-1 | planned |
| **EX-3** | Slim root `index.ts` | EX-2 | planned |
| **EX-4** | CI guards + **tsconfig ↔ npm export parity** | EX-3 | planned |
| **EX-5** | User + package README docs | EX-3 | planned |

One slice per PR where possible; EX-1 may split per subpath if review size demands it.

**Important (EX-4):** Monorepo `tsconfig` `paths` must match `package.json` `exports`; **`exports:validate`** in CI; **`.exports/`** cache for `exports:diff <ref>` — see [`systems/exports.md`](../systems/exports.md).

---

### EX-0 — Export scripts bootstrap

**Goal:** `scripts/exports/` + `.exports/cache/`; tier rules in code; read-only **`exports:inventory`**; no committed snapshot JSON.

| Task | Output |
|------|--------|
| Add **`scripts/exports/`** | See [`systems/exports.md` § Export validation scripts](../systems/exports.md#export-validation-scripts-scriptsexports) |
| **`scripts/exports/tiers.mts`** | Stable / advanced / internal rules from barrel layout |
| **`cache/meta.json` + heal** | Per-SHA snapshots under `.exports/cache/<sha>/` |
| **`pnpm exports:inventory`** | Print-only summary (Phase 1) |
| **`pnpm exports:diff`** | vs `HEAD`, ref, or `A..B` (Phase 2) |
| Audit **deep imports** | Grep `@i18nprune/core/` outside allowlist |
| Review [future subpaths backlog](#recommended-future-subpaths-backlog) | Priority before EX-3 |

**Exit criteria:**

- [x] `pnpm exports:inventory` prints root/tier summary for working tree and optional ref
- [x] `pnpm exports:diff` works vs `HEAD` and at least one tag/ref (cache + `git show`)
- [x] `cache/meta.json` auto-heals missing/corrupt entries (see systems doc)
- [x] `pnpm exports:validate` stub or minimal paths/host checks (full gate in EX-4)
- [x] Host migration checklist derived from importer map (below)
- [x] Known deep-import violations listed with target subpath fix (below)

Also shipped beyond original EX-0 scope: **`exports:trend`**, **`exports:timeline`**, **`exports:graph`**, **`exports:help`**. Operator docs: [`scripts/exports/README.md`](../../scripts/exports/README.md).

#### EX-0 — deep imports (fix in EX-1 / EX-2)

These resolve today via tsconfig **`@i18nprune/core/*`** wildcard but are **not** npm `exports` keys — invalid for external SDK consumers.

| Import | Location | Target fix |
|--------|----------|------------|
| `@i18nprune/core/shared/constants/issueCodes.js` | `packages/cli/src/shared/errors/__tests__/handler.test.ts` | `@i18nprune/core/issues` (EX-1) |
| `@i18nprune/core/shared/languages/normalize.js` | `scripts/catalog/build.ts` | `@i18nprune/core/shared` public export (EX-1) |

Published **`runtime/node`**, **`runtime/web`**, **`runtime/edge`**, **`runtime/helpers/sync`** are valid — not violations.

#### EX-0 — host migration checklist (execute in EX-2)

| Host | Current surface | EX-2 target |
|------|-----------------|-------------|
| **`packages/cli`** | Root barrel + `/config`, `/runtime/*`, `/report-schema`; 2 deep `shared/*` imports above | Op subpaths where bundle helps; **`/issues`** for codes; **`/internal`** for envelope glue; zero deep paths |
| **`apps/extension`** | Root `runXxx` + `/runtime/node` | Stable + op subpaths only; **no `/internal`** |
| **`apps/web`**, **`apps/report`**, **`apps/workers/*`** | `/runtime/web` or `/edge`, `/report-schema` | Stable + op subpaths; avoid root flat cherry-picks post–EX-3 |
| **`examples/sdk/**`** | Root + `/runtime/node` | Stable + **`/advanced`** when needed; **no `/internal`** |
| **`apps/landing`** | `/runtime/*` (docs strings) | Keep published runtime subpaths only |

Re-run **`pnpm exports:inventory -v`** and **`pnpm exports:graph`** before/after each EX-2 host PR.

---

### EX-1 — Add subpath barrels (non-breaking)

**Goal:** New import paths exist; root unchanged until EX-3.

| Task | Detail |
|------|--------|
| Add `packages/core/src/exports/{issues,utils,advanced,internal}.ts` | Thin re-export barrels; wire from source modules, not self-import `@i18nprune/core/...` |
| Align `/shared` barrel | Full flat + namespace on subpath only |
| Extend `tsup.config.ts` `subpathEntries` | Match existing `/validate` pattern |
| Extend `package.json` `exports` | `./issues`, `./utils`, `./advanced`, `./internal` |
| `publish:verify` / `tests/publish-types` | New subpaths resolve |

**Exit criteria:**

- [ ] `import { … } from '@i18nprune/core/issues'` (etc.) works from monorepo consumers
- [ ] Root `index.ts` still builds unchanged
- [ ] `pnpm run core:build` + `pnpm typecheck` green

---

### EX-2 — Migrate monorepo hosts

**Goal:** First-party packages import from correct subpaths; behavior unchanged.

| Host | Guidance |
|------|----------|
| `packages/cli` | `/internal` for envelope glue; `/issues` for codes; domain subpaths where bundle helps |
| `apps/extension` | Stable + op subpaths only — **no `/internal`** |
| `apps/workers/*`, `apps/web`, `apps/report` | Stable + op subpaths; `/advanced` when needed; avoid `/internal` |
| `examples/sdk/**` | Stable + `/advanced`; **no `/internal`** |

**Exit criteria:**

- [ ] Grep: zero `@i18nprune/core/internal` (and no root `internal.*` usage) from `apps/extension/**` and `examples/sdk/**`
- [ ] `pnpm typecheck` + `pnpm test` green

---

### EX-3 — Slim root barrel (breaking)

**Goal:** Root contains stable flat entrypoints + namespaces only.

| Remove from root | Destination |
|------------------|-------------|
| Flat `ISSUE_*` | `/issues` (+ `issues` namespace on root) |
| Pure helpers | `/utils` (+ `utils` namespace) |
| Bulk `shared/*` cherry-picks | `/shared` (+ `shared` namespace) |
| Advanced / internal flats | `/advanced`, `/internal` (+ namespaces) |
| Duplicate shared domain namespaces on root | Prefer domain namespace (`validate`) or `/shared` — see [`systems/exports.md`](../systems/exports.md) |

| Keep on root (flat) | Examples |
|---------------------|----------|
| Orchestration | `runValidate`, `runSync`, `runGenerate`, … |
| Context | `resolveContext`, `tryResolveContext`, `createCoreContext`, `createTranslateContext`, … |

| Add on root (namespace only) | `issues`, `utils`, `shared`, `advanced`, `internal` |

**Exit criteria:**

- [ ] Root export count materially reduced (target: **&lt;150** named flat exports; namespaces excluded)
- [ ] No flat re-exports from `/internal` or `/advanced` on root
- [ ] Major version bump on `@i18nprune/core`
- [ ] Receipt row in [`shipped-slices.md`](./shipped-slices.md) + `apps/git/scripts/phases.config.json`

---

### EX-4 — CI guards + tsconfig ↔ npm parity

**Goal:** Tiers stay honest after refactors; monorepo dev imports cannot bypass published API.

#### Monorepo path aliases (tsconfig vs npm exports)

**Problem:** Root [`tsconfig.json`](../../tsconfig.json) and [`packages/core/tsconfig.json`](../../packages/core/tsconfig.json) define a permissive wildcard:

```json
"@i18nprune/core/*": ["packages/core/src/*", "packages/core/src/*/index.ts"]
```

That resolves **any** deep source path in typecheck (e.g. `@i18nprune/core/shared/constants/issueCodes.js`) even when **`package.json` `exports` does not publish it**. This creates hidden coupling and “works in monorepo, invalid for npm SDK” imports.

**Required fix (same slice as CI guards):**

| Task | Detail |
|------|--------|
| **Remove** `@i18nprune/core/*` wildcard | From root + `packages/core/tsconfig.json` |
| **Replace with explicit allowlist** | One `paths` entry per key in `packages/core/package.json` `exports` (including new `/issues`, `/utils`, `/advanced`, `/internal` after EX-1) |
| **Fix violations** | Repoint deep imports to tier/op subpaths (known today: CLI test → issue code; `scripts/catalog/build.ts` → language normalize) |
| **CI grep** | Fail when `packages/cli`, `apps/*`, `examples/*`, `scripts/*` import `@i18nprune/core/<path>` where `<path>` is not in the allowlist |
| **Inside `packages/core`** | Relative imports between modules only — no `@i18nprune/core/*` self-imports (tsup-safe) |
| **`pnpm exports:validate`** | CI gate — policy inventory + paths parity + host imports + root-barrel rules (see [`systems/exports.md`](../systems/exports.md)) |

**Rule:** `tsconfig` `paths` mirrors **`exports`** — not `src/**` folder structure. Adding a subpath requires updating **both** files in the same PR.

#### Other guards

| Guard | Mechanism |
|-------|-----------|
| `/internal` importers | CI grep or lint: block `apps/extension/**`, `examples/sdk/**` |
| Inventory drift | Optional: fail if root export count grows without inventory update |
| Extension bundle | Keep host externalization baseline (~45KB `out/extension.js` with external core) |
| Knip / publish-types | Subpath barrels stay wired |

**Exit criteria:**

- [ ] No `@i18nprune/core/*` wildcard in tsconfig; allowlist matches `package.json` `exports` keys
- [ ] Zero deep-import violations outside `packages/core/src/**`
- [ ] CI fails on forbidden `/internal` imports from extension/examples
- [ ] CI fails on non-allowlisted `@i18nprune/core/...` imports from hosts
- [ ] **`pnpm exports:validate`** green in CI (wired in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) or `//#exports:validate` in typecheck)
- [ ] Documented in [`systems/exports.md`](../systems/exports.md)

---

### EX-5 — User docs

**Goal:** Integrators know stability tiers without reading maintainer docs.

| Task | Output |
|------|--------|
| Add `docs/exports/README.md` | Public tier table, import examples, semver notes |
| Update `packages/core/README.md` | Subpath table includes `/issues`, `/utils`, `/advanced`, `/internal` |
| Update [`docs/sdk/operations.md`](../../docs/sdk/operations.md) | Cross-link stability tiers vs runtime A/B |
| Fix stale link in [`extension/README.md`](./extension/README.md) | Point to `docs/exports/README.md` |

**Exit criteria:**

- [ ] No maintainer-only links in VitePress user docs (docs boundary rule)
- [ ] `pnpm sync:verify` green if frontmatter/index touched

---

## Recommended future subpaths (backlog)

**Not in EX-1 scope** — decide during EX-0 inventory and add **after** tier subpaths (`/issues`, `/utils`, `/advanced`, `/internal`) land. Same pattern always:

- **Subpath:** full flat + nested namespace exports for that domain
- **Root:** `export * as <name>` only — no flat duplicates from the subpath
- **`package.json` + tsconfig:** explicit entry (no wildcard)

### Already shipped (op / tier subpaths)

| Subpath | Root namespace | Notes |
|---------|----------------|-------|
| `/validate`, `/sync`, `/generate`, `/init`, `/locales`, `/missing`, `/cleanup`, `/quality` | `validate`, `sync`, … | Op bundle graphs — keep promoting |
| `/config`, `/types`, `/report-schema`, `/runtime/*` | `config`, … (partial) | Infrastructure |
| `/shared` | **`shared`** (after EX-3) | i18n cross-cutting — stop root cherry-picks |

### EX-1 (locked — implement in this phase)

| Subpath | Root namespace | Stability |
|---------|----------------|-----------|
| **`/issues`** | **`issues`** | Stable |
| **`/utils`** | **`utils`** | Stable |
| **`/advanced`** | **`advanced`** | Advanced |
| **`/internal`** | **`internal`** | Internal |

### Backlog — recommended domain subpaths (evaluate before EX-3)

These domains are **large on the root barrel today** but lack a dedicated npm subpath. Adding them reduces root noise and matches how hosts already think about the platform.

| Candidate subpath | Root namespace | Typical entry / surface | Priority | Notes |
|-------------------|----------------|-------------------------|----------|-------|
| **`/doctor`** | `doctor` | `runDoctor`, doctor findings types | **High** | Worker + CLI; mirror other ops |
| **`/review`** | `review` | `runReview` | **High** | Worker route exists |
| **`/share`** | `share` | `runShare`, `runShareList`, upload prep | **High** | Web/report/extension hosts |
| **`/report`** | `report` | `runReport`, `renderReportHtml` | **High** | Distinct from `/report-schema` (Zod only) |
| **`/translate`** | `translator` or `translate` | `runTranslate`, provider factories | **Medium** | Overlaps `/generate` — decide split: translate-only graph vs full generate |
| **`/cache`** | `cache` | `resolveCacheConfig`, project disk cache helpers | **Medium** | Custom hosts, `--debug-cache`; policy may span `/advanced` |
| **`/analysis`** | `analysis` | `resolveProjectAnalysis`, scan / key-site reads | **Medium** | Extension WI, worker validate path |
| **`/patching`** | `patching` | `runPatching`, patch plan builders | **Medium** | CLI-first; advanced integrators |
| **`/extractor`** | `extractor` | Extractor namespace, key-site scan | **Medium** | Extension / worker; [`knip.md`](../systems/knip.md) barrel |
| **`/suggestions`** | `suggestions` | Locale suggestion helpers | **Low** | May fold into `/locales` instead |
| **`/reference`** | `reference` | Reference / uncertain-key policy reads | **Low** | Likely `/advanced` or `/shared` |
| **`/policies`** | `policies` | Preserve / parity policy helpers | **Low** | Overlap with op payloads — avoid unless bundle wins clear |

**Naming:** prefer **`/translate`** (verb, matches `runTranslate`) with root namespace `translator` *or* align both to `translate` during inventory — pick one in EX-0, document in [`systems/exports.md`](../systems/exports.md).

**Do not add** a subpath per `shared/` leaf (`/json`, `/scanner`, …) — those stay under **`/shared`** with root `shared.*`.

### Backlog decision checklist (EX-0)

For each candidate row:

1. Is there a **`runXxx`** or a host that needs a **standalone bundle graph**?
2. Would root namespace **`export * as`** duplicate an existing op subpath?
3. Does the graph overlap `/generate` or `/advanced` enough to merge instead?
4. Add to EX-1 follow-up slice or defer to post-1.0?

---

## Explicit non-goals

- Changing CLI `--json` envelopes, issue code **strings**, or parity fixtures byte-for-byte
- `@deprecated` re-exports — remove and update call sites per repo rules
- Webview bundle diet (separate concern)
- Collapsing op subpaths (`/validate`, …) into `/advanced`

---

## Relationship to extension phase

Extension [`core-integration.md`](./extension/core-integration.md) should pin **stable + op subpaths** after EX-3. Revisit extension import list when EX-2 closes.

---

## See also

- [`../systems/exports.md`](../systems/exports.md) — durable export system rules
- [`../systems/knip.md`](../systems/knip.md) — barrel ignore catalog
- [`../systems/health.md`](../systems/health.md) — `core:build` before typecheck
- [`docs/sdk/operations.md`](../../docs/sdk/operations.md) — `runXxx` + runtime Tier A/B
- [`systems/exports.md` § Export validation scripts](../systems/exports.md#export-validation-scripts-scriptsexports) — `pnpm exports:*` tooling

---

## Export validation scripts (`scripts/exports/`)

**Spec:** [`systems/exports.md` § Export validation scripts](../systems/exports.md#export-validation-scripts-scriptsexports). Implement in **EX-0** (bootstrap + committed inventory); enforce in **EX-4** (CI).
