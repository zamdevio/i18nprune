# Tree & naming phase

**Status:** **Active** — after **[`cross-platform.md`](./cross-platform.md)** (**XP-0…7** shipped).  
**Hub:** [`V1-RELEASE.md`](./V1-RELEASE.md) · **Sprint narrative:** [`active-phase.md`](./active-phase.md) · **Shipped receipts:** [`shipped-slices.md`](./shipped-slices.md)

**Execution model:** **Sessions** (logical groupings) → **Slices** (work units within a session; gates after each slice mentally).  
**Commit default:** **one commit per session** when the session is done (not one commit per slice).  
**Rules:** [`maintainer/agents/architecture.md`](../agents/architecture.md) · **Gates:** [`maintainer/systems/health.md`](../systems/health.md)

---

## Why this phase

Contributor speed now depends on predictable file locations more than new abstractions. This phase standardizes **logic / types / tests** layout so navigation and refactors stay cheap.

**Outcomes:** faster onboarding · less import drift · simpler moves · fewer duplicated models.

**In scope:** logic/type path parity · test mirroring · domain barrels · naming normalization · file split heuristics.

**Out of scope (non-goals):** runtime behavior changes · API semantics changes · migration shims for old internal paths · preserving deep-import-only domains · transitional aliases (see [Non-goals](#non-goals)).

---

## Sessions at a glance

| Session | Theme | Slices | Typical blast radius |
|---------|--------|--------|----------------------|
| **T0** | Conventions & gates (read first) | — | None (reference) |
| **T1** | Reference ops (templates) | T1.1–T1.4 | Verify / tiny fixes |
| **T2** | Locales command ops | T2.1–T2.4 | Small, isolated |
| **T3** | Init | T3.1–T3.2 | Small |
| **T4** | Generate resume | T4.1 | Small |
| **T5** | Project cache (`cache/`) | T5.1 | Medium |
| **T6** | Sync human helpers | T6.1 | Small |
| **T7** | Large engines & shared | T7.1–T7.7 | Medium–large |
| **T8** | Share | T8.1 | Medium |
| **T9** | Report polish | T9.1 | Small |

**Recommended execution order** (smallest blast radius first; types → logic barrels → tests → imports within each slice):

```txt
T0 (read) → T2.1 → T2.2 → T2.3 → T2.4 → T3.1 → T3.2 → T4.1 → T6.1 → T5.1
  → T1.1–T1.4 (verify reference ops; skip slices with zero drift)
  → T7.1 → T7.2 → T7.3 → T7.4 → T7.5 → T7.6 → T7.7
  → T8.1 → T9.1
```

---

## Session T0 — Conventions & gates (no PR)

Read before the first tree slice. No code PR for T0.

### Target structure rules

1. **Logic / type parity** — logic at `packages/core/src/<domain>/<sub>/…`; matching types at `packages/core/src/types/<domain>/<sub>/index.ts` (split sibling `.ts` files when the barrel would be large).
2. **Tests mirror logic** — `src/<domain>/<sub>/__tests__/<logic-file>.test.ts` (subfolders under `__tests__/` only when volume/fixtures require it).
3. **Barrels at domain edges** — every folder with child scripts exposes `index.ts`; call sites use barrels, not deep paths.
4. **Minimal files** — combine small related scripts; split by cohesive concern when size or ownership demands it.
5. **Naming** — domain intent, not history; align logic / types / test basenames where possible.

### Import policy

- Prefer folder-barrel imports across domain boundaries.
- Sibling modules in the **same** folder import **leaf** files (`./delta.js`), not `./index.js` (avoids cycles — see [`health.md`](../systems/health.md)).
- After each move, update all call sites in the same slice — no temporary dual paths.

### Per-slice migration order (within one domain)

1. Move or normalize **types** into `types/<domain>/`.
2. Align **logic** barrels and `run.ts` (implementation only).
3. Align **tests** path and basename.
4. Fix **imports** (core, CLI, namespaces, root barrel).
5. Run gates (below).

### Gates (every slice)

| When | Command |
|------|---------|
| **Always** | `pnpm typecheck` · `pnpm test` |
| **CLI argv / human stderr / `--json` / exit codes touched** | `pnpm vitest run tests/parity` |
| **Moved files, new barrels, deleted modules** | `pnpm madge:circular` · `pnpm knip` |

Knip/madge are **required** when module structure changes ([`architecture.md` § 8](../agents/architecture.md#8-health-gates), [`health.md`](../systems/health.md)). Hygiene-only knip fixes belong in the same PR only if you already changed structure.

### Acceptance checklist (all slices)

- [ ] Logic and `types/<domain>/` path parity for touched paths
- [ ] No `export type` left in touched `run.ts` (types live under `types/`)
- [ ] Tests live beside the logic they cover (`__tests__/` under the same subfolder when applicable)
- [ ] Barrels exist at touched domain edges; no new deep-import-only surfaces
- [ ] `pnpm typecheck` and `pnpm test` pass
- [ ] Parity suite pass if CLI contract touched
- [ ] `pnpm madge:circular` and `pnpm knip` pass if structure changed

---

## Domain inventory (`packages/core/src`)

Top-level domains (2026-06-01 survey). **Aligned** = run types in `types/<domain>/`, op barrel re-exports types from `types/`, tests generally colocated.

| Domain | `types/<domain>/` | Drift signal | Notes |
|--------|-------------------|--------------|--------|
| **doctor** | Yes | Low | **Template** — `run.ts` logic-only; types from `types/doctor/` |
| **missing** | Yes | Low | **Template** — `types/missing/missingRun.ts` |
| **patching** | Yes | Low | **Template** — `types/patching/*` |
| **extractor** | Yes | Low | **Template** — `types/extractor/*` |
| **generate** (main) | Yes | Low | Barrel exports `types/generate/`; see **resume** |
| **sync** | Yes | Medium | Run types in `types/sync/`; `humanEmit.ts` / `humanLeafSummary.ts` still export helper types |
| **validate** | Yes | Low | Run types in `types/validate/` |
| **review** | Yes | Low | `types/review/reviewRun.ts` |
| **cleanup** | Yes | Low | Some helper types in `cleanup/*.ts` + `types/cleanup/` |
| **quality** | Yes | Low | `types/quality/` |
| **report** | Yes | Low | Minor impl exports (`report/build.ts`, `report/index.ts`) |
| **analysis** | Yes | Low | `analysis/project.ts` has one exported type |
| **project** | Yes | Low | Types under `types/project/`; no `export type` in `project/**` impl |
| **config** | Yes | Medium | Schema types in `config/schema/` (large); align barrels only in tree slices |
| **translator** | Yes | Low | `types/translator/cache.ts` etc. |
| **locales/dynamic** | Yes | Low | `types/locales/dynamicRun.ts`; `dynamic/run.ts` logic-only |
| **locales/list** | Yes | Low | `types/locales/listRun.ts` |
| **locales/delete** | Yes | Low | `types/locales/deleteRun.ts` |
| **locales/** (helpers) | Yes | Low | Helper types in `types/locales/`; tests at `locales/__tests__/<module>.test.ts` mirror flat modules |
| **init** | Partial | **High** | `export type` in `init/run.ts`, `init/presets/fields.ts`, `init/detect/*`; tests split `init/__tests__` vs `init/detect/__tests__` |
| **generate/resume** | Partial | **High** | `RunGenerateResumeLocaleInput` in `generate/resume/run.ts` |
| **cache** | Partial | **High** | `export type` in `cache/index.ts`, `rebuildPolicy.ts`, `resolveConfig.ts`, `trackedFiles.ts`, `localesLayout.ts` (run policy lives outside `run.ts`) |
| **share** | Partial | Medium | Rich `types/share/`; many `export type` in `share/payload/`, `share/view/`, `share/cache/` impl files |

**Quick drift commands** (re-run before a slice):

```bash
rg 'export type' packages/core/src/locales packages/core/src/init packages/core/src/cache --glob '*.ts' -l
rg 'export type' packages/core/src -g '**/run.ts'
```

---

## Session T1 — Reference ops (templates)

Use these folders as the **copy pattern** for T2+. Slices are **verify-and-fix** only if survey still shows drift.

### Slice T1.1 — doctor

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/doctor/`, `packages/core/src/types/doctor/` |
| **Drift to fix** | None expected — confirm `run.ts` has no `export type`; barrel re-exports from `types/doctor/` |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` |

### Slice T1.2 — missing

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/missing/`, `packages/core/src/types/missing/` |
| **Drift to fix** | Confirm tests under `missing/__tests__/` mirror `run.ts` / write-plan modules |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` |

### Slice T1.3 — patching

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/patching/`, `packages/core/src/types/patching/` |
| **Drift to fix** | None expected — `types/patching/run.ts` holds run input types |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` |

### Slice T1.4 — extractor

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/extractor/`, `packages/core/src/types/extractor/` |
| **Drift to fix** | Confirm sub-domain barrels (`extractor/shared/`, `extractor/dynamic/`, …) and `__tests__/` placement |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` |

---

## Session T2 — Locales command ops

Known high-priority drift (`export type` in `run.ts` and helper modules). **Work slice-by-slice (T2.1 → T2.4); commit once when the session is done** (see [Commit & PR discipline](#commit--pr-discipline)).

**Status:** T2.1 (`types/locales/dynamicRun.ts`) already landed in the working tree; T2.2–T2.4 complete the session.

### Slice T2.1 — `locales/dynamic`

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/locales/dynamic/`, `packages/core/src/types/locales/` (add `dynamicRun.ts` or extend barrel), `packages/core/src/namespaces/` if needed |
| **Drift to fix** | Move `DynamicRunOptions`, `DynamicHostHooks`, `DynamicJsonPayload`, `DynamicRunResult` out of `dynamic/run.ts`; barrel imports from `types/locales/`; add `locales/dynamic/__tests__/` if tests exist or move from `locales/__tests__/` |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · `pnpm madge:circular` · `pnpm knip` · parity if CLI `locales dynamic` JSON touched |

### Slice T2.2 — `locales/list`

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/locales/list/`, `packages/core/src/types/locales/` |
| **Drift to fix** | Move `ListJsonPayload`, `ListRunResult` (and related) to `types/locales/`; colocate `list/__tests__/` |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | Same as T2.1 |

### Slice T2.3 — `locales/delete`

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/locales/delete/`, `packages/core/src/types/locales/` |
| **Drift to fix** | Move `DeleteTargetResult`, `DeleteJsonPayload`, `DeleteRunResult` to `types/locales/`; colocate `delete/__tests__/` |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | Same as T2.1 |

### Slice T2.4 — `locales` helpers

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/locales/summary.ts`, `resumeTargets.ts`, `targets.ts`, `generateTargets.ts`, `source.ts`, `locales/__tests__/` |
| **Drift to fix** | Colocate types with `types/locales/` siblings; split or move tests so helper tests sit beside the module under test (not only top-level `locales/__tests__/`) |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · `pnpm madge:circular` · `pnpm knip` |

---

## Session T3 — Init

### Slice T3.1 — init run types

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/init/run.ts`, `packages/core/src/types/init/` (`initRun.ts`) |
| **Drift to fix** | Move `RunInitHostInput` and run-facing types from `run.ts` into `types/init/`; `init/index.ts` re-exports types only from `types/init/` |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · `pnpm madge:circular` · `pnpm knip` · parity if `init --json` envelope paths change |

### Slice T3.2 — init detect & presets

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/init/detect/`, `packages/core/src/init/presets/`, `packages/core/src/init/template.ts`, `init/__tests__/`, `init/detect/__tests__/` |
| **Drift to fix** | Move `export type` from `presets/fields.ts`, `detect/index.ts`, `detect/project.ts` into `types/init/`; align test paths with detect vs presets folders |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | Same as T3.1 |

---

## Session T4 — Generate resume

### Slice T4.1 — `generate/resume`

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/generate/resume/`, `packages/core/src/types/generate/`, `generate/__tests__/resume*.test.ts` |
| **Drift to fix** | Move `RunGenerateResumeLocaleInput` to `types/generate/`; add `generate/resume/__tests__/` and move resume tests beside `resume/run.ts` |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · `pnpm madge:circular` · `pnpm knip` · parity if `generate --resume` CLI output touched |

---

## Session T5 — Project cache

### Slice T5.1 — `cache/` implementation types

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/cache/` (except `cache/io/` if unchanged), `packages/core/src/types/cache/`, `cache/__tests__/` |
| **Drift to fix** | Relocate `export type` from `cache/index.ts`, `rebuildPolicy.ts`, `resolveConfig.ts`, `trackedFiles.ts`, `localesLayout.ts` into `types/cache/` leaves; keep `cache/io/` hash paths stable unless types-only |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · `pnpm madge:circular` · `pnpm knip` · parity if `--debug-cache` lines or cache-related CLI JSON touched |

---

## Session T6 — Sync

### Slice T6.1 — sync human helpers

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/sync/humanEmit.ts`, `humanLeafSummary.ts`, `packages/core/src/types/sync/`, `sync/__tests__/` |
| **Drift to fix** | Move helper payload types into `types/sync/`; ensure `sync/index.ts` barrel only re-exports; tests stay under `sync/__tests__/` |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · parity if sync human stderr touched |

---

## Session T7 — Large engines & shared

One **domain or cohesive subfolder per PR**. Do types before barrels before test moves.

### Slice T7.1 — `analysis/`

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/analysis/`, `packages/core/src/types/analysis/` |
| **Drift to fix** | Move type export from `analysis/project.ts` into `types/analysis/` if still present |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · `pnpm madge:circular` · `pnpm knip` |

### Slice T7.2 — `config/` (barrels & locales subfolder)

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/config/locales/`, `config/index.ts`, `config/schema/index.ts` barrels — **not** rewriting `schema/root.ts` field definitions |
| **Drift to fix** | Barrel-only / `export type` re-home for `config/locales/*` and top-level config index; no config validation behavior change |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · `pnpm madge:circular` · `pnpm knip` |

### Slice T7.3 — `project/`

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/project/` (prepare, readiness, `__tests__/`), `packages/core/src/types/project/` |
| **Drift to fix** | Test folder names mirror `prepare/` vs `readiness/`; no new types in impl |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · `pnpm madge:circular` · `pnpm knip` |

### Slice T7.4 — `generate/` leaf modules

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/generate/assessTargetPreflight.ts`, `localeTranslate.ts`, `generate/__tests__/` |
| **Drift to fix** | Move remaining `export type` in generate impl files to `types/generate/`; tests named after logic files |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · parity if generate JSON/human output touched · `pnpm madge:circular` · `pnpm knip` |

### Slice T7.5 — `shared/locales/` (selected subtrees)

| Field | Detail |
|-------|--------|
| **Scope** | Pick **one** subtree per PR: e.g. `shared/locales/read/`, `shared/locales/write/`, `shared/locales/targets/`, or `shared/locales/layout/` — not the entire `shared/` tree in one PR |
| **Drift to fix** | Types in `types/locales/` or `types/json/`; `__tests__/` beside leaves; barrel discipline per [`health.md`](../systems/health.md) |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · `pnpm madge:circular` · `pnpm knip` · parity when any command using locale IO changes CLI output |

### Slice T7.6 — `translator/`

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/translator/`, `packages/core/src/types/translator/`, `translator/cache/__tests__/` |
| **Drift to fix** | Confirm cache types only in `types/translator/cache.ts`; barrel imports |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · `pnpm madge:circular` · `pnpm knip` |

### Slice T7.7 — `extractor/` subtrees (if any drift remains)

| Field | Detail |
|-------|--------|
| **Scope** | One extractor sub-domain per PR (`extractor/dynamic/`, `extractor/shared/`, …) only if T1.4 found gaps |
| **Drift to fix** | Per T1.4 template |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · `pnpm madge:circular` · `pnpm knip` |

---

## Session T8 — Share

### Slice T8.1 — share impl types → `types/share/`

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/share/payload/`, `share/view/`, `share/cache/`, `share/emit/`, `packages/core/src/types/share/`, `share/__tests__/` |
| **Drift to fix** | Move run-facing / payload types from impl files into `types/share/` leaves; keep `share/index.ts` as barrel; preserve `types/share/shareRun.ts` as orchestration types home |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · `pnpm madge:circular` · `pnpm knip` · parity if `share` CLI JSON touched |

---

## Session T9 — Report

### Slice T9.1 — `report/` impl exports

| Field | Detail |
|-------|--------|
| **Scope** | `packages/core/src/report/build.ts`, `report/index.ts`, `packages/core/src/types/report/`, `report/__tests__/` |
| **Drift to fix** | Any remaining public types only in `types/report/`; tests beside `run.ts` / `build.ts` |
| **Acceptance** | [T0 checklist](#acceptance-checklist-all-slices) |
| **Gates** | `pnpm typecheck` · `pnpm test` · parity if report CLI/archive metadata touched |

---

## Commit & PR discipline

**Critical:** tree work is **not** one phase-wide refactor. Work **slice-by-slice** inside a session (mental gates after each slice); **commit once per session** when that session’s slices are done.

| Rule | Detail |
|------|--------|
| **Work per slice** | Scope each slice to its table row (e.g. **T2.2** only while implementing). Run gates after each slice before moving on. |
| **One commit per session (default)** | e.g. **T2** = T2.1+T2.2+T2.3+T2.4 in **one** commit when the session is finished. |
| **T0** | No commit (docs/conventions only). |
| **T1** | Commit only if verification produced **actual file changes**; skip an empty T1 commit when all reference ops are already clean. |
| **PRs** | **Default:** one PR per **session** (matches session commit). **Optional:** one PR per slice for review, then squash-merge — still prefer a single session commit on the branch before merge when possible. |
| **2–3 commits (exception)** | Only when a **session** is large and logically separable — preferred split: (1) types-only, (2) tests + import fixes. State the split in the PR description. |
| **Do not commit unless asked** | Agents and contributors run gates locally; user/on-call creates commits when ready. |
| **No drive-by** | No unrelated knip/format/behavior changes in tree PRs. |

### Commit message format

Follow [Conventional Commits](https://www.conventionalcommits.org/) and [`maintainer/agents/git.md`](../agents/git.md). Recent repo examples: `refactor(cli): …`, `fix(xp): …`, `test(xp-7): …`, `chore(tree): …`.

**Shape:**

```text
<type>(<scope>): <imperative description> [(optional-session-or-slice-id)]
```

**Tree phase examples:**

```text
chore(tree): locales ops — types and test parity (T2)
refactor(core): move init run types into types/init (T3)
refactor(core): align cache policy types with types/cache (T5)
test(tree): colocate generate resume tests under resume/__tests__ (T4)
```

Use `refactor(core)` for pure moves; `chore(tree)` when the session is structure-only with no logic change; `test(tree)` or `test(core)` when the PR is mostly test relocation.

### PR title format

Mirror the **session** id and domain (slice id optional in body):

```text
[tree T2] locales command ops — tree parity
[tree T5] cache — policy types in types/cache
[tree T3] init — run, detect/presets types and tests
```

PR body should link this doc section, list slices completed in the session, list folders touched, and paste the [acceptance checklist](#acceptance-checklist-all-slices) with boxes checked.

---

## Non-goals

- Preserving old internal path compatibility or dual import paths during migration.
- Keeping legacy comments, `@deprecated` re-exports, or transitional aliases — **remove and update call sites** in the same slice.
- Behavior, `--json` envelope, stderr, exit codes, or issue code changes (unless a separate product slice explicitly owns contract change — then parity updates are that slice’s job, not a drive-by in tree work).
- CLI shim files that re-export core types.
- Whole-repo `shared/` or `config/schema/root.ts` rewrites in a single PR.

---

## Worker checklist (copy per slice; commit at session end)

```markdown
## Tree session: T__  (slice: T__.__)

- [ ] Read Session T0 rules + session/slice tables in maintainer/phases/tree.md
- [ ] Scope limited to listed folders for this slice only
- [ ] Step 1: types → types/<domain>/
- [ ] Step 2: run.ts / impl — no export type
- [ ] Step 3: barrels (index.ts) re-export from types/
- [ ] Step 4: tests → __tests__/ beside logic
- [ ] Step 5: fix imports (core, namespaces, CLI if any)
- [ ] pnpm typecheck + pnpm test after this slice (before next slice in session)
- [ ] pnpm vitest run tests/parity  (if CLI contract touched)
- [ ] When **all** session slices done: pnpm madge:circular + pnpm knip (if structure changed)
- [ ] One commit per session when user asks; PR title [tree T__] … (PR per session default)
- [ ] Do not git commit unless user asked
```

---

## Slice index (one line each)

| ID | Scope |
|----|--------|
| **T1.1** | doctor — verify template alignment |
| **T1.2** | missing — verify template alignment |
| **T1.3** | patching — verify template alignment |
| **T1.4** | extractor — verify barrels & tests |
| **T2.1** | locales/dynamic — types off run.ts + tests |
| **T2.2** | locales/list — types off run.ts + tests |
| **T2.3** | locales/delete — types off run.ts + tests |
| **T2.4** | locales helpers — types + test colocation |
| **T3.1** | init run — types to types/init |
| **T3.2** | init detect/presets — types + test paths |
| **T4.1** | generate/resume — types + resume __tests__ |
| **T5.1** | cache/ — policy types to types/cache |
| **T6.1** | sync human helpers — types to types/sync |
| **T7.1** | analysis — impl types to types/analysis |
| **T7.2** | config — barrels / locales subfolder only |
| **T7.3** | project — test layout vs prepare/readiness |
| **T7.4** | generate leaf modules — types + test names |
| **T7.5** | shared/locales subtree (one per PR) |
| **T7.6** | translator — cache types & barrels |
| **T7.7** | extractor subtree — only if T1.4 found gaps |
| **T8.1** | share — impl types to types/share |
| **T9.1** | report — impl exports + test layout |

---

## Related

- [`maintainer/agents/architecture.md`](../agents/architecture.md) — package topology, `runXxx`, type layout, barrels
- [`maintainer/systems/health.md`](../systems/health.md) — knip, madge, parity gates
- [`maintainer/agents/git.md`](../agents/git.md) — commit message conventions
- [`shipped-slices.md`](./shipped-slices.md) — do not re-implement shipped behavior migrations
