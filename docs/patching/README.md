# Auto-patching

Auto-patching keeps i18n loader wiring aligned after locale mutations (`generate`, `sync`, `locales delete`) without requiring manual edits every run.

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

## Backlog (patching hardening)

- **`patch --init`** — tighten messaging when config injection skips (`skipped_existing`).
- **Resolver** — tests: never mutate unknown fields; mismatch policy modes (`ask` / `auto` / `warn`).
- **Shared CLI orchestration** — one patching handler path for `patch`, `sync --patch`, `generate --patch`, `locales delete --patch` (centralize envelope + `canAsk` / `--yes` / `--json`).
- **Core structure** — optional folder barrels under `packages/core/src/patching/*` (no behavior change).
- **Generated module contract** — doc + tests: no stale “public API” constants; default-locale preservation across mutation flows.
- **Docs** — troubleshooting in this README; mismatch examples in `config.md`; command docs for `--init` injection statuses.
- **Tests** — resolver + loader variants; config injection status cases; optional integration `init → patch → sync --patch → generate`.

## Implementation locations

- Core engine/contracts: `packages/core/src/patching/index.ts`, `packages/core/src/types/patching/index.ts`
- CLI command host and guidance: `packages/cli/src/commands/patch/run.ts`, `packages/cli/src/shared/patching/apply.ts`
