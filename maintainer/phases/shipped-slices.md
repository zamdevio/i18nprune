# Closed slices — reference only (do not duplicate trackers)

Narratives live in **user docs** below; phase checklists here are intentionally **minimal**.

| Slice | Status | User docs |
|-------|--------|-----------|
| **Locales** (`list`, meta `edit`, `dynamic`, `delete`, `--json`) | Shipped | [`commands/locales`](../../docs/commands/locales/README.md) |
| **Generate** (core translate path, `--json`, progress envelope, identity guard) | Shipped | [`commands/generate`](../../docs/commands/generate/README.md), [`behavior`](../../docs/behavior/json-long.md) |
| **Fill → `generate --resume`** (CLI + core; **`fill`** command removed) | Shipped (superseded) | [`commands/generate`](../../docs/commands/generate/README.md) (**`--resume`**) |
| **Exports + baseline `--json`** | Shipped | [`docs/exports/README.md`](../../docs/exports/README.md), [cli-json parity](../../docs/edge-cases/solved/cli-json-command-parity.md) |
| **`i18nprune.dev` / `apps/web`** baseline | Shipped | `apps/web` (marketing site codebase) |
| **Command orchestrator boundary** | Shipped (guardrail) | [`commands/orchestration/README.md`](../../docs/commands/orchestration/README.md), [`ADR 006`](../../docs/architecture/decisions/006-command-orchestrator-boundary.md) |
| **Key reference + preserve + `--ask`** | Shipped | [`docs/regex/README.md`](../../docs/regex/README.md), [`docs/cli/prompts/README.md`](../../docs/cli/prompts/README.md), [`docs/config/policies/README.md`](../../docs/config/policies/README.md) |
| **Key observations (`keySites`) + validate JSON** | Shipped | [`docs/regex/key-sites-and-dynamic.md`](../../docs/regex/key-sites-and-dynamic.md), [`docs/exports/core.md`](../../docs/exports/core.md) (`keySites` namespace) |
| **`missing` command** | Shipped | [`commands/missing`](../../docs/commands/missing/README.md) |
| **`sync`** merge preserves structured `{ value }` leaves at existing paths | Shipped (engine) | Uses core `mergeToTemplateShape` — pair with **`locales` / metadata** docs when you document edge cases |
| **Translate policy** (classifier → schema → resolver → `runGenerate` → handoff → JSON `translateFailureOutcome` → partial-run **`onIncompleteRun`** / envelope) | Shipped (steps 1–10) | [`docs/config/translate.md`](../../docs/config/translate.md) |
| **Translation providers + progress** (core progress types, CLI stderr bar, concurrency, pacing, routing, auto-fallback, provider defaults, route reporting, health monitor) | Shipped (Session A) | [`docs/config/translate.md`](../../docs/config/translate.md), [`docs/commands/generate`](../../docs/commands/generate/README.md) |
| **Doctor** core migration (`runDoctor` in `core/src/doctor/run.ts`; CLI is thin host) | Shipped | [`examples/sdk/doctor`](../../examples/sdk/doctor/runDoctor.ts) |
| **Report** core migration (`runReport` in `core/src/report/run.ts`) | Shipped | — |
| **Locales** core migration (`runDynamic`, `runLocalesList`, `writeLocaleMetaEdit`, `deleteLocaleFiles`) | Shipped | — |
| **Core-op architecture** — all ops migrated to core `runXxx` entries; CLI is thin host | Shipped (Session A.2) | — |
| **Extractor hardening** (Session C.1 — bindings, orchestrator expansion, prose filter, parity tests, inventory, methodology) | Shipped | [`docs/extractor/README.md`](../../docs/extractor/README.md), [`edge-case inventory`](../../docs/edge-cases/unsolved/inventory.md) |
| **Patching hardening** (integration tests, shared CLI run wiring, resolver/tests, user docs, core types/barrels) | Shipped | [`docs/patching/README.md`](../../docs/patching/README.md) |
| **Init / onboarding (Session F)** — `runInit`, presets + scoring, config template, CLI **`init`** (`--auto`, `--preset`, `--json`) | Shipped (core + CLI) | [`init.md`](./init.md) · extension host: [`extension/README.md`](./extension/README.md) (I1–I3 planned) |
| **Locales multi-topology (Session H)** — reader/writer, `flat_file` / `locale_directory`, ops on segment targets, layout fixtures | Shipped (core + CLI) | [`locales.md`](./locales.md) |
| **Cache index (locales row 10)** — `localeSegments` + `localesLayout` in `files.json`; single `analysis.json`; drop `snapshot.json` / CLI report-doc cache | Shipped (core + CLI) | [`cache.md`](./cache.md) § Shipped baseline · [`docs/cli/cache.md`](../../docs/cli/cache.md) |
| **Cache incremental analysis (Phase 0–1 + 3)** — srcRoot-relative scan paths, src delta patch, `cache.rebuild` / `fullRescanThresholdPercent`, `--debug-cache` rebuild lines | Shipped (core + CLI) | [`cache.md`](./cache.md) · [`docs/cli/cache.md`](../../docs/cli/cache.md) |
| **Cache profiles** — `cache.profile` safe/balanced/fast, `resolveCacheConfig`, `--cache-profile`, init `--rich` template | Shipped (core + CLI) | [`docs/cli/cache.md`](../../docs/cli/cache.md) § Cache profiles |
| **Cache locale-aware rebuild (Phase 2)** — target-only reuse, source-only `missingKeys` patch, `readSourceLocaleLeavesForMissing`, leaf-based missing keys | Shipped (core) | [`cache.md`](./cache.md) · [`docs/cli/cache.md`](../../docs/cli/cache.md) |
| **Cache invalidate policy (Phase 4)** — skip `analysis.json` delete after target-only sync/generate; `decideProjectAnalysisCacheInvalidation`; `--debug-cache` invalidation line | Shipped (core + CLI) | [`cache.md`](./cache.md) § Phase 4 |
| **Translate-cache (H.1)** — L1 memo + L2 `translations/<code>.json`; `cacheHits` progress; startup heal; port types in `types/translator/cache.ts` | Shipped (core + CLI) | [`translate-cache.md`](./translate-cache.md) · [`docs/cli/cache.md`](../../docs/cli/cache.md) |
| **Share (C.3+)** — core `share.json` + **`runShare`** + list/view/delete + human emit + **`core/project/parseZip`** + worker CRUD + worker `routes/v1/` + CLI **`i18nprune share`** | Shipped (tracker rows 0–6) | [`apps.md`](./apps.md) |

**Next vertical:** **[`apps.md`](./apps.md)** (C.3+). Hub: **[`V1-RELEASE.md`](./V1-RELEASE.md)**.
