# `sync` — command system sheet

## Status

- **Stability:** stable (internals may refactor; **`--json`**, issue codes frozen per parity rules)
- **Last reviewed:** systems tree bootstrap

## Operator surface

- **User docs:** `docs/commands/sync/README.md`

## CLI entry

- **Orchestration + `--json`:** `packages/cli/src/commands/sync/jsonEnvelope.ts` → **`runSync(ctx, opts, runtime?)`**
- **Human UI:** `packages/cli/src/commands/sync/run.ts` → **`sync()`**
- **Idle metadata row when no `--metadata` / `--strip-metadata`:** `packages/cli/src/commands/sync/idleLocaleMetadataReport.ts`

## Core & shared

| Concern | Location |
|---------|----------|
| Merge + prune (pure) | `packages/core/src/sync/apply.ts` → **`computeSyncedLocaleJson`**; re-exports **`mergeToTemplateShape`**, **`pruneToTemplateShape`** on `packages/core/src/sync/index.ts`, namespace **`@i18nprune/core/sync`** |
| Template string leaves → map | `collectStringLeaves` + `Map` paths (CLI uses `@i18nprune/core`) |
| Structured / strip metadata | `packages/core/src/shared/localeLeaves/index.ts` → **`applyLocaleLeafMode`**, **`resolveLocaleLeafMode`** |
| Target selection | `parseSyncLangSelection`, **`resolveSyncTargetFiles`** |
| Uncertain prefixes (merge/prune opts) | `buildKeyReferenceContextFromReportDetails` + `resolveReferenceConfig('sync', …)` in CLI |

## Flow (short)

1. Load **project report** (dynamic sites + key refs) → reference config for **`uncertainKeepPrefixes`** when policy is protect/warn-only.
2. Read **template** (source locale JSON); **`collectStringLeaves`** → **`sourceMap`**.
3. Resolve **target files**; for each locale file:
   - **`computeSyncedLocaleJson(template, cur, preserve, mergeOpts)`** → **`next`**.
   - **Human counts (merge/prune only):** **`summarizeSyncLeavesForHumanLog(sourceLeaves, cur, next)`**.
   - If **`--metadata`** or **`--strip-metadata`**: **`resolveLocaleLeafMode`** (explicit flags only in this orchestration path) → **`applyLocaleLeafMode({ localeJson: next, sourceMap, mode })`** → **`finalNext`** + **`localeMetadataReports[file]`**.
   - Else: **`finalNext = next`**; **`idleLocaleMetadataReportForSkippedSync`** for JSON row.
4. Write if changed and not dry-run; build **`CliJsonEnvelope`**.

## Metadata flags (sync-specific)

- **Orchestration today:** only **`opts.metadata`** / **`opts.stripMetadata`** enable **`applyLocaleLeafMode`** for sync. Config defaults for sync metadata are **not** wired through this path (see user docs / config schema if that evolves).

## Frozen API

- **`--json`** payload kind **`sync`**, **`data.files`**, **`localeMetadataReports`**, issues such as **`i18nprune.sync.metadata_flag_conflict`** / missing locale warnings — parity rules in workspace **`i18nprune`**.

## Related

- **Ops entry table:** [`../operations/flows-and-entrypoints.md`](../operations/flows-and-entrypoints.md)
