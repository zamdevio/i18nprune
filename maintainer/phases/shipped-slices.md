# Shipped slices — ISO week timeline

**Reference only** — check before re-implementing. Narratives live in **user docs** (links below); this file is the **receipt log**.

**Portal mirror:** [`apps/git/scripts/phases.config.json`](../../apps/git/scripts/phases.config.json) (`git.i18nprune.dev` timeline). When you close a slice here, add a matching `shipped[]` bullet in the same ISO week.

**Convention:** Weeks use **ISO-8601** (`YYYY-Www`, Monday start). Sections are **newest first**. Each row is one closed slice; `Status` is always shipped unless noted.

**Next vertical:** VS Code extension — [`extension/README.md`](./extension/README.md).

---

## 2026-W24 · Extractor fusion

**Theme:** Mixed-template extractor hardening (E.1–E.6), locales dynamic JSON contract, dynamic count semantics (D.1), translate placeholder hardening (T.1).

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **E.1–E.6** | Mixed-template fusion (`partitionTemplateHoles`, `analyzeTemplateCall`, `dynamicRef`, `staticPrefix` / `runtimeSegments` / `classification`), const-map hardening (E.2), non-literal hints (E.3), lexical safety tests (E.4), comment parity (E.5), `groupDynamicKeySites` + template detail in `locales dynamic` JSON (E.6) | [`architecture/extraction/dynamic`](../../docs/architecture/extraction/dynamic.md) |
| **D.1** | **Active vs commented** dynamic counts — summary `dynamic=active`, optional `commented=M`; warnings/issues use active; `dynamicSites` / `count` stay total; additive JSON (`dynamicActive`, `dynamic.commented`, …) across validate/cleanup/missing/sync/quality/review/generate/report | [`dynamic/README`](../../docs/dynamic/README.md) |
| **T.1** | **Placeholder sentinel hardening** — `restore()` accepts MT spacing/case variants (`__ I18NPRUNE_0 __`); `validateRestored` / leak check on `I18NPRUNE_\d+`; generate **always** copies placeholder-only leaves (`{{a}} · {{b}}`) without MT; resume repairs same; tests + `issues/translate#placeholder-sentinel-mangled` | [`issues/translate`](../../docs/issues/translate.md) |

---

## 2026-W23 · Release & platform

**Theme:** v0.1.0 public release, CI/tree pass, git analytics portal, SEO/IndexNow, v1-readiness docs, CLI hardening.

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **CI-1–5** | Split `verify` DAG; PR Vitest `github-actions` reporter; nightly knip/madge; debug `cli-dist-debug-<os>`; Turborepo affected typecheck + `scope` job (docs-only skips product matrix) | [`systems/ci.md`](../systems/ci.md) · [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) |
| **XP-0–7** | OS matrix CI; `path.join` cache/translate; `I18NPRUNE_HOME`; path warnings; archive report env | [`systems/platform.md`](../systems/platform.md) |
| **T0–T10** | `packages/core` logic/types/test parity; `packages/cli` barrel imports without core type shims; apps shim cleanup (`96aed18`, 2026-06-01) — repo-wide non-barrel `export type {` count **0** | [`systems/README.md`](../systems/README.md) |
| **Release prep (npm)** | `@i18nprune/core` publish layout, rolled `dist` DTS fix, `publish:verify`, version/tag guidance | [`agents/git.md`](../agents/git.md) · [`packages/core/README.md`](../../packages/core/README.md) |
| **Report schema in core** | Zod + ingest in `packages/core/src/shared/report/`; `@i18nprune/core/report-schema` | [`commands/report`](../../docs/commands/report.md) |
| **v1-readiness docs** | Description frontmatter, `sync:verify`, `--json` contract hub, VitePress pin | [`docs/contributors`](../../docs/contributors/README.md) |
| **git.i18nprune.dev** | Analytics SPA, sync pipeline, validate gate, CI auto-deploy | [`apps/git`](../../apps/git/README.md) |
| **CLI hardening (W23)** | Locale suggestions; cleanup `--target` / `--rg`; `--no-color` logging flags | [`commands/cleanup`](../../docs/commands/cleanup.md) |
| **Report HTML in core** | `renderReportHtml`; report SPA asset wiring | [`commands/report`](../../docs/commands/report.md) |

---

## 2026-W22 · Share

**Theme:** Share hardening, worker CRUD, web + report share UX, worker metadata.

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **Share (C.3+)** | Core `share.json` + **`runShare`** + list/view/delete + human emit + **`core/project/parseZip`** + worker CRUD + CLI **`i18nprune share`** | [`systems/share.md`](../systems/share.md) · [`commands/share`](../../docs/commands/share/README.md) |
| **Share hardening (6b)** | `share.bak/` raw backups, cache-epoch skip, view 404 purge, `--debug-cache`, `cache_empty` / `stale_cache_row_removed` issues | [`issues/share`](../../docs/issues/share.md) |
| **Worker hardening (6c)** | Prepared + archive ingest, structured API errors, IP rate limit, `HASH_ALREADY_EXISTS` + `?force=true`, storage-pressure eviction, snapshot timings, `localeTags` + archive `filesEpoch` | [`runtime/worker`](../../docs/runtime/worker.md) |
| **Web share UX (7)** | `/#/workspace?id=` open/hydrate, link-only Share when remote, prepared JSON upload + optional archive | [`commands/share`](../../docs/commands/share/README.md) |
| **Report share UX (8)** | `/#/?id=` hydrate, import panel, overview share/copy/delete, `@i18nprune/ui` runtime shell, editor deep links | [`systems/ui.md`](../systems/ui.md) |
| **Worker report route (9)** | `GET /v1/projects/:id/report` via core `runReport` + preloaded snapshot | [`systems/share.md`](../systems/share.md) |
| **Worker metadata (W)** | Canonical metadata grouping, `edge-worker` runtime family, nullable transport scalars, consistent `?force=` ingest | [`runtime/worker`](../../docs/runtime/worker.md) |

---

## 2026-W21 · Hardening

**Theme:** Extractor C.1, patching, init, locales multi-topology, landing, UI kit, cache profiles.

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **Extractor (C.1)** | Bindings, orchestrator expansion, prose filter, parity tests, inventory entries, methodology docs | [`architecture/extraction`](../../docs/architecture/extraction/README.md) · [`extractor.md`](./extractor.md) |
| **Patching hardening** | Integration tests, shared CLI run wiring, resolver/tests, user docs, core types/barrels | [`patching`](../../docs/patching/README.md) |
| **Init (Session F)** | `runInit`, presets + scoring, config template, CLI **`init`** (`--auto`, `--preset`, `--json`) | [`config`](../../docs/config/README.md) |
| **Locales multi-topology (H)** | Reader/writer, `flat_file` / `locale_directory`, ops on segment targets, layout fixtures | [`commands/locales`](../../docs/commands/locales/README.md) |
| **UI kit (`@i18nprune/ui`)** | Theme, toolbar, overlay, pagination, worker Swagger shell (phases 0–4) | [`systems/ui.md`](../systems/ui.md) |
| **Landing (D.2)** | Locale layouts section, Used By marquee, report callouts, mobile polish | [`apps/landing`](../../apps/landing) |
| **Cache profiles** | `cache.profile` safe/balanced/fast, `resolveCacheConfig`, `--cache-profile`, init `--rich` template | [`cli/cache`](../../docs/cli/cache.md) |
| **Cache locale-aware rebuild (Phase 2)** | Target-only reuse, source-only `missingKeys` patch, leaf-based missing keys | [`systems/cache.md`](../systems/cache.md) |
| **Cache invalidate (Phase 4)** | Skip `analysis.json` delete after target-only sync/generate; `--debug-cache` invalidation line | [`systems/cache.md`](../systems/cache.md) |

---

## 2026-W20 · Engine

**Theme:** `generate`/`resume` engine, translator, translation cache, all ops migrated to core `runXxx`.

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **Generate** | Core translate path, `--json`, progress envelope, identity guard | [`commands/generate`](../../docs/commands/generate.md) |
| **Fill → `generate --resume`** | CLI + core; **`fill`** command removed | [`commands/generate`](../../docs/commands/generate.md) |
| **Translate policy** | Classifier → schema → resolver → `runGenerate` → handoff → JSON `translateFailureOutcome` → `onIncompleteRun` | [`config/translate`](../../docs/config/translate.md) |
| **Translation providers (A)** | Core progress types, CLI stderr bar, concurrency, pacing, routing, auto-fallback, health monitor | [`config/translate`](../../docs/config/translate.md) |
| **Translate-cache (H.1)** | L1 memo + L2 `translations/<code>.json`; `cacheHits` progress; startup heal | [`cli/cache`](../../docs/cli/cache.md) |
| **Core-op architecture (A.2)** | All ops → core `runXxx`; CLI is thin host (Doctor, Report, Locales list/dynamic/delete/meta) | [`ADR 006`](../../docs/architecture/decisions/006-command-orchestrator-boundary.md) |
| **Cache index (row 10)** | `localeSegments` + `localesLayout` in `files.json`; single `analysis.json`; drop `snapshot.json` | [`systems/cache.md`](../systems/cache.md) |
| **Cache incremental (0–1 + 3)** | srcRoot-relative scan paths, src delta patch, `cache.rebuild` / `fullRescanThresholdPercent`, `--debug-cache` | [`cli/cache`](../../docs/cli/cache.md) |

---

## 2026-W19 · Core wiring

**Theme:** `@i18nprune/core` package, CLI delegation, translate policy foundation, VitePress docs, apps scaffold.

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **@i18nprune/core** | Monorepo package; CLI delegates to core | [`sdk/operations`](../../docs/sdk/operations.md) |
| **VitePress docs** | `apps/docs` public site scaffold | [`docs/`](../../docs/) |
| **Apps scaffold** | `web`, `report`, `landing`, `workers` baselines | `apps/` |

---

## 2026-W16 · Scaffold

**Theme:** Monorepo scaffold and lockfile.

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **pnpm workspace** | Workspace + lockfile setup | — |

---

## 2026-W15 · Genesis

**Theme:** Full CLI surface, core, config, extractor, providers, tests in one shot.

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **CLI commands** | validate, cleanup, missing, sync, quality, review, doctor, report, generate, locales, share entrypoints | [`docs/cli`](../../docs/cli/README.md) |
| **Locales** | `list`, meta `edit`, `dynamic`, `delete`, `--json` | [`commands/locales`](../../docs/commands/locales/README.md) |
| **`missing` command** | Scaffold keys into locale JSON | [`commands/missing`](../../docs/commands/missing.md) |
| **`sync` engine** | Merge preserves structured `{ value }` leaves at existing paths | [`commands/sync`](../../docs/commands/sync.md) |
| **Key observations (`keySites`)** | Literal scan + validate JSON `count` / `keyObservations` | [`architecture/extraction`](../../docs/architecture/extraction/README.md) |
| **Key reference + preserve + `--ask`** | Uncertain-key policy, preserve merge, interactive prompts | [`config/policies`](../../docs/config/policies.md) |
| **Exports + baseline `--json`** | Stable envelope + issue codes | [cli-json parity](../../docs/edge-cases/solved/cli-json-command-parity.md) |
| **Command orchestrator boundary** | Core data-only; hosts present (guardrail) | [`ADR 006`](../../docs/architecture/decisions/006-command-orchestrator-boundary.md) |
| **`i18nprune.dev` / `apps/web`** | Marketing site baseline | `apps/web` |
| **Integration tests** | Sample fixture + parity discipline | [`tests/fixtures/sample-i18n`](../../tests/fixtures/sample-i18n) |

---

## Slice ID index (lookup by tag)

| ID | Week | One-line |
|----|------|----------|
| **D.1** | W24 | Active vs commented dynamic counts |
| **E.1–E.6** | W24 | Mixed-template extractor hardening + dynamic groups |
| **C.1** | W21 | Extractor bindings + prose filter |
| **CI-1–5** | W23 | CI matrix, Turborepo scope, nightly hygiene |
| **XP-0–7** | W23 | Cross-platform paths + home dir |
| **T0–T10** | W23 | Tree/naming parity |
| **6b / 6c / 7 / 8 / 9 / W** | W22 | Share + worker + web/report UX |
| **H.1** | W20 | Translate L1/L2 cache |
| **Session F** | W21 | Init + presets |
| **Session H** | W21 | Locales multi-topology |
| **Session D.2** | W21 | Landing layouts section |

---

## Maintainer workflow

1. Land the slice (tests + typecheck green).
2. Add a **row** under the ISO week you shipped in (create a new `## YYYY-Www` section if needed).
3. Add a **`shipped[]` bullet** in [`phases.config.json`](../../apps/git/scripts/phases.config.json) for the same week.
4. Fold durable engineering detail into [`systems/`](../systems/README.md) when behavior warrants a map — not every receipt needs a systems doc update.
