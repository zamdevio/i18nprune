<!-- AUTO-GENERATED — do not edit. Source: apps/releases/content/**/*.yaml · regenerate with `pnpm releases:generate`. -->

# Changelog

Release notes for the **i18nprune CLI** and **`@i18nprune/core`**. Each entry links to its
full notes on the [releases portal](https://releases.i18nprune.dev). This file is generated
from `apps/releases/content/` — edit the YAML, never this file.

---

## CLI v1.1.1 — 2026-10-18

v1.1.1 — cleanup uncertain-prefix protection is honoured in both source and `--target` modes, and `kits identical` resolves source files correctly under segmented layouts.

[Full release notes →](https://releases.i18nprune.dev/cli/1.1.1)

**Fixed**
- `cleanup --target <locale>` routes through the same candidate path as source mode, so preserve rules and the uncertain-prefix guard apply identically (BUG-002)
- `excludedUncertain` is emitted in both cleanup modes, and `data.uncertainPrefixes` is populated in target mode (was hardcoded `[]`) (BUG-002)
- Declared `policies.preserve.uncertainPrefixes` reaches the reference context via `collectDeclaredUncertainPrefixes` (BUG-001)
- Review payloads report the locale code — not the segment stem — as `sourceLocale` under `locale_per_dir` (BUG-003)
- `kits identical` resolves source leaves through `segmentsForLocaleCode` instead of joining `${code}.json`, fixing `locale_per_dir` and `feature_bundle` layouts (BUG-003)

---

## Core v1.1.1 — 2026-10-18

v1.1.1 — cleanup uncertain-prefix protection in both modes and layout-aware source resolution for review. Lockstep with CLI 1.1.1.

[Full release notes →](https://releases.i18nprune.dev/core/1.1.1)

**Fixed**
- Target-mode cleanup now shares `computeCleanupCandidateKeys` with source mode; both emit `excludedUncertain` and populate `data.uncertainPrefixes` (BUG-002)
- `policies.preserve.uncertainPrefixes` is threaded into the reference context builders via `collectDeclaredUncertainPrefixes` (BUG-001)
- Review payload `sourceLocale` is derived from the layout-aware origin rather than `basenameNoExt(sourceLocalePath)`, which returned the segment stem under `locale_per_dir` (BUG-003)

---

## CLI v1.1.0 — 2026-10-10

v1.1.0 — extractor HOC §A (preset hook binds + same-file one-hop aliases) for higher literal key recall.

[Full release notes →](https://releases.i18nprune.dev/cli/1.1.0)

**Added**
- `expandEffectiveFunctions` — import bindings composed with same-file local helpers
- Hook helper presets (`packages/core/src/extractor/bindings/hookPresets.ts`)

**Changed**
- More call sites resolve to literal keys instead of `non_literal` / dynamic sites (extraction results change; no API change)

**Performance**
- Local-helper scan is lazy — skipped unless a preset hook import or a `const X = <helper>` pattern is present

---

## Core v1.1.0 — 2026-10-10

v1.1.0 — extractor HOC §A: preset hook binds and same-file one-hop helper aliases. Lockstep with CLI 1.1.0.

[Full release notes →](https://releases.i18nprune.dev/core/1.1.0)

**Added**
- `expandEffectiveFunctions` / `expandWithLocalHelpers` on the bindings barrel
- `HOOK_HELPER_PRESETS` table for framework hook → helper binds

**Changed**
- Key-site and dynamic orchestrators use the composed effective-helper set
- One-hop aliases expand only on an exact RHS match against an already-effective helper (single pass)

**Performance**
- Lazy scan — no extra work when a file has no preset hook import and no `const X = <helper>` assignment

---

## CLI v1.0.3 — 2026-09-10

v1.0.3 — sync preserve hydrate (copyPrefixes / uncertainPrefixes); retain reasons in JSON; VitePress docs home.

[Full release notes →](https://releases.i18nprune.dev/cli/1.0.3)

**Added**
- `policies.preserve.uncertainPrefixes` — declared uncertain roots for sync retain/hydrate
- `data.scanExtrasRetained` on sync JSON envelope
- Docs site home — `apps/docs/index.md` (`layout: home`) installed by docs sync

**Changed**
- Sync template = scan ∩ source **plus** preserve expansion
- `scan_extras_retained` issue includes sample paths, reasons, and `paths[]`

**Fixed**
- Sync no longer drops declared `copyPrefixes` trees that the code scan never resolved
- publish:verify — fixture install no longer resolves the monorepo workspace package under pnpm 12

---

## Core v1.0.3 — 2026-09-10

v1.0.3 — preserve-aware sync retain/hydrate; scanExtrasRetained; lockstep with CLI 1.0.3.

[Full release notes →](https://releases.i18nprune.dev/core/1.0.3)

**Added**
- `PreservePolicy.uncertainPrefixes`
- `expandSchemaPathsForPreserve` / `mergeSyncKeepPrefixes` / sync retain reason helpers
- Additive `SyncJsonOutput.scanExtrasRetained`

**Changed**
- Sync schema paths include declared preserve trees from source

**Fixed**
- Declared preserve prefixes no longer require scan-resolved keys to survive sync prune/hydrate

---

## CLI v1.0.2 — 2026-07-18

v1.0.2 — version lockstep + OIDC publish; kits payload/readiness fixes; docs version tokens; audit dependency bumps.

[Full release notes →](https://releases.i18nprune.dev/cli/1.0.2)

**Security**
- Dependency audit — vitest ≥3.2.6, hono ≥4.12.25, vite ≥6.4.3; workspace overrides for axios ≥1.16.0, form-data ≥4.0.6, postcss ≥8.5.10

**Added**
- `scripts/release/sync.ts` — `--sync`, `--verify`, `--up <version>` with downgrade / far-bump risk gates
- Root scripts — `versions:sync`, `versions:verify`, `versions:up`
- `.github/workflows/release.yml` — tag `v*` → verify → parallel OIDC publish
- `versions:verify` in CI typecheck job
- Kits project readiness preset (`kits`) via `assertKitsReadiness`
- Docs `__I18NPRUNE_VERSION__` / `__I18NPRUNE_TAG__` replacement in VitePress sync

**Changed**
- Published root `dependencies` trimmed to runtime-needed packages (`jiti`, `zod`, `@inquirer/prompts`); commander/chalk/string-width moved to `devDependencies` (bundled)
- Kits banners/descriptions shortened; kits labels in `COMMAND_BANNER_LABELS`; 64-char subtitle fallback cap
- `tsup` CLI build — `platform: 'node'` + createRequire banner
- `@i18nprune/ui` — `react-dom` peer + devDep aligned with React 18

**Fixed**
- Kits baseline / honest / pr — read flat validate payload fields instead of nonexistent `summary.*`
- Kits commands require the same readiness family as validate before running

---

## Core v1.0.2 — 2026-07-18

v1.0.2 — kits readiness preset; lockstep with CLI 1.0.2 publish line.

[Full release notes →](https://releases.i18nprune.dev/core/1.0.2)

**Added**
- `kits` readiness preset in `project/readiness/presets` for CLI kits hosts

**Changed**
- Readiness type union includes `kits`

---

## CLI v1.0.1 — 2026-07-11

v1.0.1 — placeholder sentinel leak repair; kits terminal markdown; CLI help workflows and mnemonic command/flag aliases.

[Full release notes →](https://releases.i18nprune.dev/cli/1.0.1)

**Added**
- `--no-repair-sentinel-leaks` on `sync` and `generate` (skip automatic sentinel repair)
- JSON `sentinelRepairs[]` on `sync` and `generate` with `path`, `mode`, `from`, `to` / `sourceValue`, `localeCode`, `localeFile`
- Dry-run preview — `wouldRepairSentinelLeaks` count plus bounded per-path `detail` lines (respects `-T` / `-F` / `-n`)
- Kits dual output — `markdownText` for files, `formatKitsTerminalMarkdown` for TTY
- Root help `Workflows:` recipes (bootstrap, sentinel fix, CI gate, share snapshot)
- Per-command help extras — `Examples`, `Related`, group `Workflows`, and generic `Notes` on every command
- Positional aliases — `val`, `gen`, `cfg`, `miss`, `qual`, `rev`, `rep`, `prov`, `langs` (≤4-char names stay canonical: `sync`, `kits`, `locales`, `patch`, `doctor`, `share`, …)
- Group subcommand aliases — `locales ls|dyn|rm`, `share up|ls|rm`, `kits id|dyn|bl` (`honest`, `pr` unchanged)
- Global flag aliases — `-y`, `-n`, `-m`, `-t`, `-T`, `-F`, `-ncl`, `-ld`, `-cp`, … ( `--source`, `--src`, `--ask` long-only)
- Command flag aliases — generate `-P`/`-R`/`-W`/`-f`/`-nrsl`; sync `-nrsl`/`-sm`; share `-wu`; kits `-fcs` (focus); languages `-flt`/`-tbl`

**Changed**
- `sync` post-merge repair copies source strings over stale `__I18NPRUNE_*` mask tokens at leaked paths
- `generate` force-queues leaked paths even when target values are non-empty; `placeholder_copy` vs full MT by leaf kind
- Kits human output — structural/secondary markdown lines dim on terminal; saved `.md` files stay ANSI-free
- `generate` live sentinel repair notice prints after translate progress clears; dry-run preview before translate
- Help Examples styling — brand-blue `i18nprune`, cyan command path, dim flags
- `help <topic>` resolves mnemonic and group alias paths (`help val`, `help kits id`, `help locales ls`)

**Fixed**
- Leak scan matches spaced sentinel variants (`I18NPRUNE _N`) that MyMemory and weak MT backends leave in locale JSON
- `__I18NPRUNE_MISSING__` scaffold tokens are not classified as MT leaks (numeric index only)
- `generate --resume` re-queues leaked placeholder paths instead of treating them as already translated
- Generate `-T` / `-F` list window wired for sentinel repair detail lines

---

## Core v1.0.1 — 2026-07-11

v1.0.1 — shared placeholder sentinel leak module; sync copy repair; generate retranslate + resume pending; read-only detect on validate/quality/review.

[Full release notes →](https://releases.i18nprune.dev/core/1.0.1)

**Added**
- `packages/core/src/shared/placeholders/sentinelLeak.ts` — single module for detect + sync/generate repair
- `SyncRunOptions.noRepairSentinelLeaks` / `GenerateRunOptions.noRepairSentinelLeaks`
- JSON `sentinelRepairs[]` on sync and generate payloads with rich per-path metadata (`from`, `to`, `sourceValue`, `localeCode`, `localeFile`)
- Dry-run `wouldRepairSentinelLeaks` count on sync and generate

**Changed**
- Sentinel leak regex — `I18NPRUNE[\s_]*\d+` detects spaced variants; `__I18NPRUNE_MISSING__` excluded from leak classification
- `emitSyncHumanMessages` / `sentinelHumanEmit` repair details respect list limit (`--top` / `--full` via host `listLimit`)
- `generate` live sentinel repair notice — after progress on live runs; dry-run preview before translate
- Detect ops emit dim suggestion detail lines via `emitSentinelLeakSuggestionDetails`

**Fixed**
- `localePathLooksTranslatedFromSource` returns false when target still contains numeric mask sentinels
- `generate --resume` re-queues leaked paths with correct source text for MT jobs
- `assessGenerateTargetPreflight` treats sentinel leaks as proceed (not fully_complete)
- Resume candidates include sentinel leaks even on preserve paths

---

## CLI v1.0.0 — 2026-07-09

v1.0.0 — native `i18nprune kits` audit commands (dynamic, identical, honest, baseline, pr); standard CliJsonEnvelope; global short flags; replaces external Kits toolkit.

[Full release notes →](https://releases.i18nprune.dev/cli/1.0.0)

**Added**
- `i18nprune kits` command group with five read-only audit subcommands
- Docs — `docs/commands/kits/*`
- Kits error JSON — `i18nprune.io.read_failed` envelope on missing baseline files

**Changed**
- Release milestone `0.1.x` → `1.0.0` (kits ship as the v1 line)
- Global Commander short aliases on root program (`-j`, `-jp`, `-T`, `-F`, `-ds`, `-dc`)

**Fixed**
- Kits respect global `-q` / `-s` / `--json` printing policy (logger + envelope, no duplicate summary in JSON mode)

---

## Core v1.0.0 — 2026-07-09

v1.0.0 — semver milestone aligned with CLI kits release; core scan/validate/quality/review surfaces unchanged API for kits orchestration.

[Full release notes →](https://releases.i18nprune.dev/core/1.0.0)

**Changed**
- Release version `0.1.4` → `1.0.0` (kits v1 milestone)

**Fixed**
- Catalog `languages.json` ensure targets monorepo artifact only when bundled
- `loader_generated` relative imports always `./` or `../` prefixed (PATH_ISSUE)

---

## CLI v0.1.4 — 2026-06-13

Patch release — cleanup defaults to static scan with opt-in `--rg`; multi-target prune; grep-friendly log flags; locale suggestions and D.1 dynamic summaries; `locales dynamic` template detail.

[Full release notes →](https://releases.i18nprune.dev/cli/0.1.4)

**Breaking**
- Argv: `--no-rg` removed — drop the flag from cleanup scripts (default is already static-only)

**Added**
- Global `--no-color`, `--no-log-channel`, and `--no-log-prefix` presentation flags
- `cleanup --rg` opt-in ripgrep string-presence guard
- `locales dynamic` template detail and grouped dynamic-key site output
- `docs/cli/output.md` — log presentation and grep-friendly CI patterns

**Changed**
- Cleanup banner and docs: static scan by default; mention `--rg` for paranoid substring guard
- Cleanup `--target` multi-locale UX — per-locale `(code)` lines, per-locale confirm/`--ask`, JSON `targetLocales[]` + `targets[]`
- Locale suggestion tips on unknown `--target` and cross-op hints in validate, missing, cleanup, sync output
- D.1 human summaries: `dynamic=active` with optional `commented=M` alongside existing counts
- `RunOptions` presentation flags wired from `preAction`; logger, ansi, and style respect them
- `renderProjectReportSpaHtml` delegates report HTML shell to core `renderReportHtml`
- Sync-after source writes: `[notice]` channel only (less noisy default)

**Fixed**
- Ripgrep no longer over-blocks cleanup by default (former `--no-rg` workaround is now the default)
- Multi-target cleanup `--target` resolution and locale typo hints aligned with core

**Removed**
- `cleanup --no-rg` flag (default is static-only; pass `--rg` when you want the ripgrep guard)

---

## Core v0.1.4 — 2026-06-13

Patch release — report HTML in core; locale suggestion engine and cross-op tips; cleanup multi-target resolution; extractor E.1–E.6 mixed-template hardening; D.1 active vs commented dynamic counts; T.1 placeholder sentinel hardening.

[Full release notes →](https://releases.i18nprune.dev/core/0.1.4)

**Added**
- Public `renderReportHtml`, `injectJsonIntoPayloadScript`, and `resolveReportSpaTemplatePath` for report SPA embedding
- `suggestExistingLocaleTargets` and `MAX_LOCALE_TARGET_SUGGESTIONS` for unknown `--target` typo hints
- Locale suggestion engine for cross-op tips (`data.suggestions[]` on validate, missing, cleanup, sync)
- `resolveCleanupTargets` for multi-target cleanup planning (`targetLocales[]`, `targets[]` on JSON)
- `RunOptions` optional `noColor`, `noLogChannel`, `noLogPrefix` (CLI presentation; SDK hosts may ignore)
- D.1 report/summary types: `dynamicSitesActiveCount` and `dynamicSitesCommentedCount` alongside existing `dynamic` counts
- Extractor E.1–E.6 mixed-template hardening (dynamic keys, nested templates, comment-aware sites)
- Tests: `packages/core/src/report/__tests__/html.test.ts`, `packages/core/src/cleanup/__tests__/resolveTargets.test.ts`

**Changed**
- Core build copies report SPA into dist via `copy-into-core.mjs`
- Cleanup JSON payloads include `targetLocales[]` and `targets[]` when `--target` selects multiple locales
- Sync clarity: `i18nprune.sync.scan_extras_retained` issue when scan finds extras post-sync
- D.1 dynamic site counts split into active vs commented (additive JSON fields; existing `dynamic` unchanged)
- T.1 generate/resume placeholder sentinel restore hardened; skip machine translation for placeholder-only leaves

**Fixed**
- Report HTML bundle: drop Node imports so Vite browser consumers load cleanly
- Multi-target cleanup `--target` resolution and locale typo hints (`zh-ch` → Did you mean: zh-cn?)
- T.1 placeholder sentinel restore and resume skip logic for placeholder-only leaves

---

## CLI v0.1.3 — 2026-06-05

Patch release — cleanup ripgrep guard default fixed; cleanup summaries and JSON counts use `dynamic` (aligned with other commands).

[Full release notes →](https://releases.i18nprune.dev/cli/0.1.3)

**Changed**
- cleanup human footer and embedded `data.summary.counts` use `dynamic` instead of `dynamicKeySites`
- cleanup `--json` payload field renamed to `data.dynamic` (see core 0.1.3 migration)

**Fixed**
- Commander `--no-rg` default no longer disables ripgrep on every cleanup run without the flag

---

## CLI v0.1.2 — 2026-06-05

Patch release — CLI and SDK versions injected at build time from each package’s `package.json`.

[Full release notes →](https://releases.i18nprune.dev/cli/0.1.2)

**Changed**
- CLI_VERSION resolved at cli:build from root package.json (esbuild define)
- Dev tsx falls back to JSON import of root package.json

**Fixed**
- apps/report Vite build failed when bundling @i18nprune/core version.ts Node imports

---

## Core v0.1.3 — 2026-06-05

Patch release — cleanup JSON envelope uses `dynamic` for non-literal key site count; run-event counts aligned.

[Full release notes →](https://releases.i18nprune.dev/core/0.1.3)

**Breaking**
- `cleanup --json` / `CleanupJsonOutput`: read `data.dynamic` instead of `data.dynamicKeySites`

**Changed**
- cleanup JSON payload field `dynamicKeySites` renamed to `dynamic`
- cleanup run.summary / embedded summary counts use `dynamic`
- cleanup progress warn `data` uses `dynamic` for site count

---

## Core v0.1.2 — 2026-06-05

Patch release — `SDK_VERSION` from `package.json` at build time; browser-safe resolver for report SPA.

[Full release notes →](https://releases.i18nprune.dev/core/0.1.2)

**Added**
- resolveSdkVersion() — same semver as SDK_VERSION for explicit host resolution

**Changed**
- Version constants use JSON `package.json` import in source instead of filesystem reads

**Fixed**
- Report app Rollup build error importing fileURLToPath from core version.ts

---

## CLI v0.1.1 — 2026-06-04

Patch release — public `@i18nprune/core` on npm, docs and README ecosystem links, releases portal.

[Full release notes →](https://releases.i18nprune.dev/cli/0.1.1)

**Changed**
- README header uses hosted logo URL and expanded ecosystem link table
- Monorepo version line aligned at 0.1.1 (root, core, workspace CLI)

**Fixed**
- Scoped @i18nprune/core npm publish no longer fails with E402 (public access)

---

## Core v0.1.1 — 2026-06-04

Patch release — first successful public npm publish with publishConfig.access public.

[Full release notes →](https://releases.i18nprune.dev/core/0.1.1)

**Changed**
- publishConfig.access public on the npm package (required for free-registry scoped publishes)

**Fixed**
- npm publish E402 "Payment Required" when publishing without `--access public`
