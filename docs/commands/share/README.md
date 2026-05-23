# `share`

Upload **prepared project snapshots** or **stored report JSON** to the public worker (`workers.i18nprune.dev`), and manage local **`share.json`** cache metadata beside the analysis cache.

Core owns orchestration, payload build, re-upload policy, and `share.json` I/O. The CLI is a thin host (confirm gate, HTTP, human lines).

## Subcommands

| Subcommand | Purpose |
|------------|---------|
| *(bare `share`)* | Shows subcommand help (same pattern as `locales`) |
| `upload` | `--project` and/or `--report` (+ optional `--from` for reports) |
| `list` | List cached share rows for this project |
| `view` | `GET /v1/projects/:id` or `/v1/reports/:id` metadata |
| `delete` | Remove one row (`--project` / `--report`) or every row (`--all`) |

## Worker URL

`--worker-url` or `I18NPRUNE_WORKER_URL` (default `https://worker.i18nprune.dev`).

Hosted API overview: [Worker / edge runtime](../../runtime/worker.md).

## Upload (`share upload`)

### Project snapshot (`--project`)

1. Core prepares a snapshot from your repo (`prepareProjectSnapshotFromRoot`) — uses local analysis cache when enabled.
2. Builds a sanitized zip payload and uploads to the worker.
3. **Primary route:** `POST /v1/projects` with a JSON **prepared envelope** (extraction, locale JSON, tree, `processorContext`).
4. **Secondary route (browser / zip-only hosts):** `POST /v1/projects/archive` with multipart zip; the worker runs prepare on the edge (no disk cache).

After a successful upload, human output includes share links and, when the worker returns it, **`retained until <ISO>`** (7-day idle retention).

### Report JSON (`--report`)

1. Load a `i18nprune.projectReport` document (`--from <file>` or in-process report build).
2. `POST /v1/reports` with `{ document }`.
3. Link: `https://report.i18nprune.dev/#/?id={reportId}` (hash route; `id` survives reload).

### Combined upload

`i18nprune share upload --project --report` runs **one** analysis pass (`prepareShareHostedFromContext`) then uploads both payloads.

### Upload flags

| Flag | Effect |
|------|--------|
| `--project` | Upload prepared project snapshot |
| `--report` | Upload report JSON |
| `--from <file>` | Report JSON path (report only) |
| `--force` | Skip hash dedup and replace the worker row for this content hash (new `projectId` / `reportId`; old URLs 404) |
| `--yes` | Skip upload confirm (manifest still prints unless `--json`) |
| `--json` | Machine envelope + links + ids; **auto-upload** (no TTY confirm) |
| `--worker-url` | Override worker base |
| Global `--no-cache` | No `share.json` read/write (always upload unless you pass ids manually) |
| Global `--debug-cache` | `[cache]` lines during prepare/upload |

**TTY:** After the manifest, CLI asks to upload unless `--yes` or `--json`. **Non-TTY:** uploads without prompting (same as `--yes`).

### Content-hash dedup

When the worker already stores the same payload hash:

- Default: **reuse** the existing `projectId` / `reportId` and return a **`HASH_ALREADY_EXISTS`** warning on the envelope.
- With **`--force`**: purge the prior row for that hash, store a **new** id (hash unchanged), old share links stop working.

Local `share.json` still records the latest id and links after either outcome.

## List / view / delete

```bash
i18nprune share list
i18nprune share view --project <workerProjectId>
i18nprune share view --report <workerReportId> --verbose
i18nprune share delete --project <workerProjectId>
i18nprune share delete --all
i18nprune share delete --all --local-only
```

| Flag / behavior | Effect |
|-----------------|--------|
| `--verbose` on `view` | Extra timing, processor, extraction, and cache sections (project metadata) |
| `--local-only` on `delete` | Remove `share.json` row only; skip worker `DELETE` |
| TTY without id on `view` / `delete` | `select()` from cached entries |
| Non-TTY without id | Error — pass `--project` or `--report` |

`share list` human table shows cache **`uploadedAt`** (when the row was written locally), byte size, links, and a 7-day TTL hint.

## Metadata and timings (`share view`)

Project **`GET /v1/projects/:id`** returns metadata only (no zip, no full previews). Useful fields:

| Field | Meaning |
|-------|---------|
| `preparedAt` | When the payload was fully prepared (CLI prepare on JSON route; zip parse + extraction end on archive route) |
| `lastAccessedAt` | Last read (upload responses also touch this) |
| `expiresAt` | `lastAccessedAt` + 7 days idle retention |
| `localeTags` | Locale codes discovered at prepare |
| `timing` | `preparedAt`, `requestReceivedAt`, `storedAt`, `prepare.*`, `extraction.*`, `edge.persistMs` |
| `processor` | Host surface (`cli`, `web`, `worker`), route (`prepared` / `archive`), `toolVersion`, environment |
| `extraction` | Summary counts + optional cache block (`filesEpoch`, analysis hit/miss when host cache was used) |

Full snapshot body: `GET /v1/projects/:id/snapshot`. Reports: metadata on `GET /v1/reports/:id`, body on `GET /v1/reports/:id/document`.

## Worker errors (CLI mapping)

Structured worker failures use stable `errors[].code` values. The CLI maps them to `i18nprune.share.remote_*` issues — see [Share issues](../issues/share.md).

Common worker codes:

| Code | HTTP | Meaning |
|------|------|---------|
| `PROJECT_NOT_FOUND` / `REPORT_NOT_FOUND` | 404 | Evicted or unknown id — re-upload |
| `PAYLOAD_TOO_LARGE` / `TOO_MANY_FILES` / `EXTRACTION_LIMIT_EXCEEDED` | 413 | Reduce zip or report size |
| `PAYLOAD_REJECTED` / `INVALID_SCHEMA` | 400 | Fix prepared envelope or report schema |
| `RATE_LIMITED` | 429 | Per-IP upload quota — retry later |
| `HASH_ALREADY_EXISTS` | 200 + warning | Same content hash already stored (not an error) |
| `STORAGE_QUOTA_EXCEEDED` | 507 | Worker storage pressure — retry or self-host |

## Examples

```bash
# Help
i18nprune share
i18nprune help share

# Upload project snapshot
i18nprune share upload --project

# Force replace worker row for same zip content
i18nprune share upload --project --force

# Upload report JSON
i18nprune share upload --report --from reports/index.json

# Project + report in one prepare pass
i18nprune share upload --project --report

# Inspect worker metadata
i18nprune share view --project <id> --verbose

# List / delete
i18nprune share list
i18nprune share delete --report <workerReportId>
i18nprune share delete --project <workerProjectId>
i18nprune share delete --all
```

## Related docs

- [Share issue codes](../issues/share.md)
- [Hosted snapshot / project prepare errors](../issues/project.md#hosted-snapshot-ingest-i18npruneprojecthosted_-upload_-source_locale_)
- [Worker / edge runtime](../../runtime/worker.md)
- [Project cache](../../cli/cache.md) — `share.json` lives beside `files.json` / `analysis.json`
