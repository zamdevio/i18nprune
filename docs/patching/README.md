# Auto-patching

Auto-patching keeps i18n loader wiring aligned after locale mutations (`generate`, `sync`, `locales edit`, `locales delete`) without requiring manual edits every run.

## Principles

- **Opt-in by config:** patching runs only when enabled (`patching.enabled: true`) or when explicitly enabled per run via CLI flag.
- **Recipe-driven:** behavior is defined by `patching.recipe` (current supported recipe: `loader_generated`).
- **Deterministic and bounded:** edits are minimal, reproducible, and constrained to configured patching paths.
- **Safe failure model:** default mode is `warn_skip` (report issues, skip writes); `strict` can hard-fail the host command.

## Command flow

Use this workflow as the default operator path:

1. Run mutation commands normally (for example `generate`) with or without `--patch`.
2. If patching was not applied (for example no `--patch`), run `i18nprune patch` to inspect state.
3. If patch reports fixable metadata drift, run `i18nprune patch --fix` to apply automatic config corrections.
4. If scaffold files are missing/corrupt, run `i18nprune patch --init` (or `--init --force` when renewal is needed).

## `patch` command intent

- **`i18nprune patch`**: analyze patching health and report diagnostics.
- **`i18nprune patch --fix`**: apply suggested `config.json` metadata corrections and config/file locale drift reconciliation.
- **`i18nprune patch --init`**: create missing scaffold files under `<src>/i18n`.
- **`i18nprune patch --init --force`**: renew CLI-owned scaffold files only (`config.json` and `loaders.generated.ts`).

## Runtime behavior

- `patching` missing or `enabled: false`: patching is skipped unless enabled for the run by CLI override.
- Enabled + valid recipe paths: plan is built, then patch writes are applied atomically.
- Invalid paths, missing files, parse/schema failures, unsupported pattern, size limit issues:
  - `warn_skip`: emit diagnostics and skip patch writes.
  - `strict`: return non-OK patch result so host command can fail.

## CLI output modes

- `--json`: emits structured output for automation and CI integration.
- `--quiet` / `--silent`: reduce human output verbosity (JSON output remains machine-stable).
- `--yes`: accepted globally for non-interactive runs; patching flow does not depend on prompts.

## Documentation map

- [Loader contract and generated-module behavior](./loader.md)
- [Patching config reference and policy](./config.md)
- [ADR 004 — Opt-in auto-patching](../architecture/decisions/004-auto-patch.md)
- [ADR 003 — User-project i18n loader integration](../architecture/decisions/003-user-i18n-loader-integration.md)

## Troubleshooting

- **`generate` / `sync` / `locales` says patching was skipped** — Patching is opt-in: set `patching.enabled: true` or pass **`--patch`** on that command. If the config lists `patching` but `configPath` or `loaderPath` is empty, the CLI warns and skips (fix the block, then retry).
- **`patch --init` warns that `i18nprune.config.*` already has a patching block** — Scaffold files under `<src>/i18n` may still be created, but an existing `patching:` section is never silently overwritten on inject. Adjust paths by hand, remove the block and run `patch --init` again, or use **`patch --init --force`** to renew CLI-owned scaffold files (see the warning text for the exact case).
- **`patch --fix` reports no changes** — There may be nothing auto-fixable; run **`i18nprune patch`** (no flags) to read diagnostics. Under **`patching.mode: 'strict'`**, invalid state can fail the command instead of warn-skip — see [config reference](./config.md#failure-and-mode-behavior).
- **`src/i18n/config.json` is invalid JSON or not the expected shape** — **`patch --fix` cannot repair it** until the file parses (the tool must read `locales[]` before it can fill metadata or reconcile drift). Use **`patch --init --force`** to replace **only** `config.json` and `loaders.generated.ts` with a fresh scaffold from locale `*.json` files on disk and the bundled catalog (any hand-edited fields on locale rows are not preserved by that renewal).
- **`generate` / `sync` with `--patch` while `config.json` is broken** — Post-command patching uses the same planner as `patch`; it skips (for example `no_changes` / parse diagnostics) until the file is valid or you run **`patch --init --force`**.

## Backlog (patching hardening)

- **`patch --init`** — tighten messaging when config injection skips (`skipped_existing`). **Done:** clearer human warnings on first-time init and `--init --force`.
- **Resolver** — tests: never mutate unknown fields; mismatch policy modes (`ask` / `auto` / `warn`). **Done:** resolver preserves unknown JSON; policy modes remain in CLI `repairPatchingConfigLocales`.
- **Shared CLI orchestration** — one patching handler path for `patch`, `sync --patch`, `generate --patch`, `locales edit --patch`, `locales delete --patch` (centralize envelope + `canAsk` / `--yes` / `--json`). **Partially done:** `applyCommandPatching` centralizes mutation commands; standalone `patch` keeps init/fix/envelope (see `maintainer/systems/patching.md`).
- **Core structure** — optional folder barrels under `packages/core/src/patching/*` (no behavior change). **Done:** documented barrel roles + grouped `patching/index.ts` exports; `planning/` and `render/` remain sub-barrels.
- **Generated module contract** — doc + tests: no stale “public API” constants; default-locale preservation across mutation flows. **Done:** maintainer map + `LOCALE_REGISTRY` order test in `index.test.ts`.
- **Docs** — troubleshooting in this README; mismatch examples in `config.md`; command docs for `--init` injection statuses. **Done:** troubleshooting + injection status table in `config.md`.
- **Tests** — resolver + loader variants; config injection status cases; optional integration `init → patch → sync --patch → generate`. **Done:** resolver preservation tests; **`tests/integration/patching.analyzeAndRun.test.ts`** (analyze → `runPatching` file drift, no CLI).

## Implementation locations

- Core engine/contracts: `packages/core/src/patching/index.ts`, `packages/core/src/types/patching/index.ts` — **data only** (diagnostics, plans, results); **no human log lines** and no `console.*`.
- CLI command host and guidance: `packages/cli/src/commands/patch/run.ts`, `packages/cli/src/shared/patching/apply.ts` — **all `[i18nprune]` patch messages** are emitted here via the CLI logger.
