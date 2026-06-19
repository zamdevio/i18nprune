# Phase — `@i18nprune/core` export tiers

**Status:** **EX-0 shipped** (governance scripts + cache); **EX-1…EX-5 planned** — major breaking refactor on `@i18nprune/core` semver.  
**Engineering map:** [`../systems/exports.md`](../systems/exports.md) (tiers, barrels, host matrix, script architecture).  
**Script operator manual:** [`scripts/exports/README.md`](../../scripts/exports/README.md) (`pnpm exports:*` commands, flags, cache).  
**User-facing mirror (EX-5):** [`docs/sdk/exports.md`](../../docs/sdk/exports.md) — stability tiers and import guidance under the SDK docs tree (no top-level `docs/exports/`).

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

**Important (EX-4):** Monorepo `tsconfig` `paths` must match `package.json` `exports`; **`exports:validate`** in CI; **`.exports/`** cache for historical refs — see [Governance scripts](#governance-scripts--already-in-place) and [`systems/exports.md`](../systems/exports.md).

---

## Governance scripts — already in place

**EX-0 delivered** the maintainer export governance system. The barrel refactor (EX-1…EX-3) does **not** need new tooling bootstrap — it needs **correct barrels** and **script updates** as the surface changes.

| Layer | Location | Role |
|-------|----------|------|
| **Operator manual** | [`scripts/exports/README.md`](../../scripts/exports/README.md) | Commands, flags, cache layout, examples |
| **Implementation** | [`scripts/exports/`](../../scripts/exports/) | Parse, tier rules, diff, validate stub, cache |
| **Durable rules** | [`systems/exports.md`](../systems/exports.md) | Tiers, barrels, host matrix, script patterns |
| **This file** | `phases/exports.md` | Slice sequencing, exit criteria, post-refactor hardening |

**Shipped commands:** `pnpm exports:{inventory,diff,validate,trend,timeline,graph,help}`  
**Cache:** `.exports/cache/<full-sha>/` (`inventory.full.json`, `timeline.summary.json`, `meta.json`) — gitignored, auto-healed, `toolVersion` auto-expire on bump.

---

## Run after each refactor slice

Use this checklist at the **end of every EX-1…EX-4 PR** (and before opening EX-3 merge). Goal: prove the working tree matches intent before `typecheck` / `test` alone would catch drift.

### 1. Inspect surface (always)

```bash
pnpm exports:inventory -v          # tier, category, targetSubpath per flat symbol
pnpm exports:graph -v              # namespace → module → target subpath
pnpm exports:diff HEAD             # uncommitted barrel edits vs last commit
```

After EX-1 subpaths exist, also:

```bash
pnpm exports:inventory -v          # confirm new symbols map to ./issues, ./utils, etc.
pnpm exports:diff v0.1.4..HEAD     # or last tag — range delta for release notes
```

### 2. Validate governance (required from EX-4; run locally during EX-1…EX-3)

```bash
pnpm exports:validate -v           # paths parity, unclassified, host rules (grows per slice)
```

Today `exports:validate` is a **stub** with minimal checks; **EX-4** turns it into the CI gate. Run it anyway during EX-1…EX-3 so failures surface early.

### 3. Repo gates (always)

```bash
pnpm run core:build
pnpm typecheck
pnpm test
```

### 4. Refresh cache when rules or barrels change materially

```bash
pnpm exports:inventory -f          # rebuild HEAD snapshot after tier/parser edits
# or bump TOOL_VERSION in scripts/exports/paths.ts → all caches auto-expire
```

| Slice closes | Minimum exports run |
|--------------|---------------------|
| **EX-1** | `inventory -v`, `graph`, `diff HEAD`, `validate -v` |
| **EX-2** | above + `diff` per host PR; grep deep imports gone |
| **EX-3** | above + `diff` vs pre-slim tag; root flat &lt;150; `trend` / `timeline` spot-check |
| **EX-4** | `exports:validate` green in CI; no manual skip |

---

## Post-refactor script hardening (apply during EX-1…EX-4)

The scripts work on **today’s** root-heavy barrel. As EX-1…EX-3 land, **update the scripts in the same PR** (or immediately after) — do not defer to “later cleanup.”

| Hardening | When | What to change |
|-----------|------|----------------|
| **`subpathSourceEntries`** | EX-1 | Add `./issues`, `./utils`, `./advanced`, `./internal` in `scripts/exports/paths.ts` |
| **`targetSubpathFor` / categories** | EX-1 | Map symbols to new tier subpaths; stop guessing `./internal` from name heuristics where barrel path is known |
| **`tiers.ts` rules** | EX-1, EX-3 | Classify by **source module** / export barrel when layout is stable; remove bootstrap name-prefix hacks |
| **Parse new barrels** | EX-1 | Inventory should read tier subpath entry files, not only root `index.ts` (if symbols move off root before EX-3) |
| **`exports:validate` paths parity** | EX-4 | Fail on `@i18nprune/core/*` tsconfig wildcard; allowlist === `package.json` `exports` |
| **`exports:validate` host imports** | EX-4 | Grep `packages/cli`, `apps/*`, `examples/*`, `scripts/*` for non-allowlisted `@i18nprune/core/...` |
| **`exports:validate` root policy** | EX-3–EX-4 | No flat leaks from `/internal`, `/advanced`, `/issues`, `/utils`, `/shared`; optional root flat budget (&lt;150) |
| **`exports:validate` unclassified** | EX-1+ | Fail when any root flat symbol has tier `unclassified` |
| **`exports:diff` tier violations** | EX-3 | Report internal/advanced symbols appearing as root flats |
| **`exports:diff --strict`** (optional) | EX-4 | Fail CI on unexpected added root flats (policy TBD) |
| **Bump `TOOL_VERSION`** | Any script logic change | Invalidates all `.exports/cache/` snapshots repo-wide |
| **Bump `SNAPSHOT_VERSION`** | Snapshot JSON shape change | Same purge behavior for on-disk files |
| **Vitest for parsers** | EX-4 (optional) | Fixture barrels under `tests/exports/` for tier/category edge cases |
| **CI wire** | EX-4 | `pnpm exports:validate` in verify or `//#exports:validate` in typecheck |

**Not in scope for scripts:** CLI `--json` parity (existing `tests/parity/`), knip unused files, packed tarball `publish-types` — see [`systems/exports.md`](../systems/exports.md).

---

### EX-0 — Export scripts bootstrap

**Goal:** `scripts/exports/` + `.exports/cache/`; tier rules in code; read-only **`exports:inventory`**; no committed snapshot JSON.

| Task | Output |
|------|--------|
| Add **`scripts/exports/`** | See [`systems/exports.md`](../systems/exports.md) + [`scripts/exports/README.md`](../../scripts/exports/README.md) |
| **`scripts/exports/inventory/tiers.ts`** | Stable / advanced / internal rules (bootstrap heuristics; refine in EX-1…) |
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
- [ ] [`Run after each refactor slice`](#run-after-each-refactor-slice) — inventory/graph/diff/validate
- [ ] [`Post-refactor script hardening`](#post-refactor-script-hardening-apply-during-ex-1ex-4) rows for EX-1 applied (`paths.ts`, categories, tier rules)

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
- [ ] [`Run after each refactor slice`](#run-after-each-refactor-slice) per host PR (`diff`, `inventory -v` on touched imports)

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
- [ ] [`Run after each refactor slice`](#run-after-each-refactor-slice) + `exports:diff` vs last release tag
- [ ] [`Post-refactor script hardening`](#post-refactor-script-hardening-apply-during-ex-1ex-4) EX-3 rows (root policy, tier violations in diff)

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
- [ ] All [`Post-refactor script hardening`](#post-refactor-script-hardening-apply-during-ex-1ex-4) rows for EX-4 complete

---

### EX-5 — User docs

**Goal:** Integrators know stability tiers without reading maintainer docs.

**Location:** Add **[`docs/sdk/exports.md`](../../docs/sdk/exports.md)** — sibling to [`docs/sdk/operations.md`](../../docs/sdk/operations.md). There is **no** `docs/exports/` tree and we do not add one; export surface docs live in the SDK section only.

| Task | Output |
|------|--------|
| Add **`docs/sdk/exports.md`** | Stability tier table (stable / advanced / internal); subpath catalog (`/issues`, `/utils`, `/shared`, `/advanced`, `/internal`, op subpaths); import examples; semver notes; cross-link runtime Tier A/B vs stability tiers |
| Update `packages/core/README.md` | Subpath table includes new tier subpaths |
| Update [`docs/sdk/operations.md`](../../docs/sdk/operations.md) | Link to `docs/sdk/exports.md` for “which subpath should I import?” |
| Update VitePress nav / index if needed | `exports` page under SDK sidebar (same cluster as operations) |
| Fix stale links | [`extension/README.md`](./extension/README.md) maintainer table → `docs/sdk/exports.md` |

**`docs/sdk/exports.md` outline (draft for EX-5):**

1. **Why subpaths** — bundle size + semver clarity (plain language, no maintainer jargon)
2. **Stability tiers** — stable / advanced / internal table with support promise
3. **Subpath catalog** — root facade vs `/validate`, `/issues`, `/utils`, `/shared`, `/advanced`, `/internal`, `/runtime/*`, `/types`, …
4. **Import patterns** — bundled host vs script quick-start (`runXxx` from op subpath vs root namespace)
5. **Runtime Tier A/B** — link to operations.md (orthogonal axis)
6. **What not to import** — `/internal` unsupported for external semver; extension/examples guidance

**Exit criteria:**

- [ ] `docs/sdk/exports.md` exists; no `docs/exports/` directory
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

- [`../systems/exports.md`](../systems/exports.md) — tiers, barrels, host matrix, script architecture
- [`scripts/exports/README.md`](../../scripts/exports/README.md) — `pnpm exports:*` operator manual
- [`../systems/knip.md`](../systems/knip.md) — barrel ignore catalog
- [`../systems/health.md`](../systems/health.md) — `core:build` before typecheck
- [`docs/sdk/operations.md`](../../docs/sdk/operations.md) — `runXxx` + runtime Tier A/B
