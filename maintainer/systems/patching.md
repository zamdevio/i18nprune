# Patching subsystem (maintainer map)

**Audience:** Maintainers and agents changing `packages/core/src/patching/**`, CLI `patch` / `--patch`, or SDK hosts that call `runPatching`.  
**User-facing:** `docs/patching/README.md`, `docs/patching/config.md`, `docs/patching/loader.md`.

---

## Core vs hosts

- **Types** live in `packages/core/src/types/patching/index.ts` (including `PatchingRunInput`, `PatchingResult`, `ResolvePatchingLocalesResult`, `RepairPatchingConfigLocalesResult`, …). Hosts import these from `@i18nprune/core` / `patching` namespace — **not** from CLI packages.
- **Engine** (`packages/core/src/patching/`): analyze → plan → apply; **no `console.*`**, no human wording — only `diagnostics` / structured results.
- **CLI glue:** `packages/cli/src/commands/patch/run.ts` (analyze / `--fix` / `--init`), `packages/cli/src/shared/patching/apply.ts` (`applyCommandPatching` for `generate` / `sync` / `locales edit|delete` with `--patch`), `configLocales.ts` (metadata repair preview + `resolvePatchingConfigLocales`).

---

## Barrel layout (`packages/core/src/patching/`)

| Entry / folder | Role |
| :--- | :--- |
| `index.ts` | Public facade: re-exports engine functions used by `namespaces/patching.ts` and tests. |
| `planning/index.ts` | Plan construction barrel (`buildPatchPlan` wiring). |
| `render/index.ts` | Generated-module string helpers barrel. |
| Flat modules (`analyze.ts`, `apply.ts`, `run.ts`, `resolver.ts`, `plan.ts`, `io.ts`, `locales.ts`, `recipe.ts`, `generatedModule.ts`, …) | Implementation; keep imports package-relative as today. |

Further physical splits are optional; the important surface for hosts is **`@i18nprune/core`** exports, not folder count.

---

## Orchestration note (Session C.2 backlog)

**Mutation commands** share **`applyCommandPatching`** (one path for `--patch` + `runPatching` + incomplete-section warnings). The standalone **`patch`** command keeps its own flow for **`--init`**, **`--fix`** drift orchestration, and human/JSON envelopes. Full deduplication of `patch` vs `applyCommandPatching` internals is optional follow-up if envelope parity ever drifts.

---

## Generated module contract (loader_generated)

- **`LOCALE_REGISTRY`** is derived from the **same `locales[]` rows** written to `config.json` during a successful plan apply (see `generatedModule.ts` + `planGenerated.ts`).
- **`DEFAULT_LOCALE_CODE`** prefers the CLI source locale when present in that set; otherwise first row / loader-resolved default (see tests in `packages/core/src/patching/__tests__/index.test.ts`).

---

## Cross-links

- Phase backlog: `docs/patching/README.md` § Backlog, `maintainer/phases/active-phase.md` (Session C.2).
- Issue codes: `ISSUE_PATCHING_*` in `packages/core/src/shared/constants/issueCodes.js`.
