# Command — `share`

**User docs:** [`docs/commands/share/README.md`](../../../docs/commands/share/README.md) · **Issues:** [`docs/issues/share.md`](../../../docs/issues/share.md)  
**Plan / tracker:** [`maintainer/phases/apps.md`](../../phases/apps.md).

## Entrypoints

| Surface | Path |
|---------|------|
| Core upload | `packages/core/src/share/ops/run.ts` → `runShare` |
| Core list / view / delete | `ops/list.ts`, `ops/view.ts`, `ops/delete.ts` |
| Payload build | `payload/buildProjectPayload.ts`, `payload/buildReportPayload.ts`, `payload/reportSemantic.ts` |
| Policy / skip | `policy/policy.ts` · project epoch via `cache/resolveInputFilesEpoch.ts` |
| `share.json` I/O + heal | `cache/io/shareJson.ts` |
| Backups | `cache/shareJsonBackup.ts` → `{projectCacheDir}/share.bak/share.json.bak.<stamp>.json` (raw bytes) |
| Cache debug lines | `cache/debug.ts` → `emitShareCacheDebug` (`channel: 'cache'`) |
| Stale row purge | `cache/purgeCacheEntry.ts` (view 404, upload re-probe) |
| Human lines (all hosts) | `emit/human.ts` → `emitShare*HumanMessages` via `run.message` |
| Worker URL normalize | `remote/resolveWorkerBaseUrl.ts` — default `https://worker.i18nprune.dev` |
| CLI argv + env | `packages/cli/bin/cli.ts` (`share` tree: `upload`, `list`, `view`, `delete`) |
| CLI worker URL | `commands/share/workerUrl.ts` · `ENV_I18NPRUNE_WORKER_URL` |
| CLI HTTP hooks | `commands/share/workerHttp.ts`, `commands/share/hooks.ts` (`debugCache` from global `--debug-cache`) |
| CLI cache debug helper | `commands/share/cacheDebug.ts` (list / view / delete human path) |
| CLI empty-cache hints | `commands/share/resolveTarget.ts` |
| SDK example | `examples/sdk/share/runShareList.ts` |

## CLI tree

```txt
i18nprune share              → help only
i18nprune share upload       → --project | --report
i18nprune share list         → [--project | --report filter]
i18nprune share view         → --project <id> | --report <id>
i18nprune share delete       → [--project | --report | --all] [--local-only]
```

Upload flags are on **`share upload`** so **`share delete --project <id>`** is not parsed as a boolean `--project` on the parent command.

## `share.json` backups

Before any overwrite of `share.json`, core copies the **existing file as raw text** (no JSON parse) into `share.bak/`. Hosts emit a **warn** (`shareJsonBackupNotice`) when a backup is created. Corrupt/oversize loads use `backupAndRemoveCorruptShareJson` then replace with an empty v1 file.

## Skip policy (upload)

| Signal | Skip reason |
|--------|-------------|
| Project `inputFilesEpoch` + `configHash` match cached row | `cache_epoch_unchanged` (skip zip build; still worker probe) |
| `payloadContentHash` (+ project `configHash`) match | `hash_unchanged` |
| Worker metadata GET 404 while hash matched | Purge row, re-upload; `stale_cache_row_removed` |

## `share delete` behavior

- **Default:** removes matching `share.json` entry **and** calls worker DELETE.
- **`--local-only`:** cache metadata only (no HTTP).
- **`--all`:** every row for this project cache (TTY confirm unless global `--yes`).
- Worker **404** on DELETE is treated as success (row already gone).

## `share view` behavior

- Metadata GET only (`GET /v1/projects/:id` or `GET /v1/reports/:id`).
- **404:** warning + purge local row; **no** stale web/report links in human output.

## Cache flags

- **`--no-cache`:** no `share.json` read/write; upload always builds payload (unless link-only).
- **`--debug-cache`:** `[cache]` run messages on upload (via `ShareHostHooks`) and on list/view/delete (CLI `emitShareListCacheDebug`).

## Parity

New `share --json` envelopes only — do not change existing op parity fixtures.
