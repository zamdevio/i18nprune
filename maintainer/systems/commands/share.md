# Command — `share`

**User docs:** [`docs/commands/share/README.md`](../../../docs/commands/share/README.md) · **Issues:** [`docs/issues/share.md`](../../../docs/issues/share.md)  
**Systems map:** [`maintainer/systems/share.md`](../../systems/share.md) · **Shipped receipts:** [`shipped-slices.md`](../../phases/shipped-slices.md).

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
| CLI worker URL | `commands/share/worker/url.ts` · `ENV_I18NPRUNE_WORKER_URL` |
| CLI HTTP hooks | `commands/share/worker/http.ts`, `commands/share/worker/fetch.ts`, `commands/share/hooks.ts` (`debugCache` from global `--debug-cache`) |
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

Backups are created only when **`loadShareJsonFile`** cannot trust the on-disk file:

- **Corrupt / malformed JSON** or **oversize**: `backupAndRemoveCorruptShareJson` → raw copy under `share.bak/`, delete bad `share.json`, write fresh `version: 1`.
- **Valid JSON but non-canonical** (unknown keys, bad rows): rewrite in place — **no** `share.bak/`.

**`saveShareJsonFile`** (upload, delete, skip touch) never writes to `share.bak/`. Hosts warn via load-time `shareJsonBackupWarnMessage` / `emitShareJsonHealHumanMessages` when corrupt/oversize bytes were backed up under `share.bak/` before heal.

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
- **`--verbose`:** extra sections (processor, extraction, cache, timings, edge, local, links). Works with **`--json`** (`verbose` on payload). Prints as **`[verbose]`** in human mode (still shown under **`--quiet`**).
- Unknown subcommand typo **`uplaod`** → explicit hint toward **`share upload`**.

## Cache flags

- **`--no-cache`:** no `share.json` read/write; upload always builds payload (unless link-only).
- **`--debug-cache`:** `[cache]` run messages on upload (via `ShareHostHooks`) and on list/view/delete (CLI `emitShareListCacheDebug`).

## Parity

New `share --json` envelopes only — do not change existing op parity fixtures.
