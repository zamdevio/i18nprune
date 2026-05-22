# Share — issue codes (`i18nprune.share.*`)

[← Issue codes index](./README.md)

Codes from **`runShare`**, **`runShareList`**, **`runShareDelete`**, and local **`share.json`** cache I/O under `~/.i18nprune/cache/projects/<id>/share.json`.

**Commands:** [`share`](../commands/share/README.md) (`upload`, `list`, `view`, `delete`).

## `json_repaired`

**Code:** `i18nprune.share.json_repaired`  
**Severity:** `warning`  
**When:** `share.json` was missing, corrupt, had duplicate rows, used the wrong worker id field (`workerReportId` on a project row, etc.), or unknown top-level keys. Core normalized entries and saved a canonical file (unless cache is read-only).  
**Who:** `loadShareJsonFile` in core (`packages/core/src/share/cache/io/shareJson.ts`).  
**What to do:**

1. Read the bullet list in the warning (what changed).
2. Do **not** edit `share.json` by hand — use `i18nprune share list` and `i18nprune share delete`.
3. Re-upload with `i18nprune share upload --project` or `--report` if you need fresh worker rows.

## `json_write_failed`

**Code:** `i18nprune.share.json_write_failed`  
**Severity:** `warning`  
**When:** Core could not persist an updated or repaired `share.json` (permissions, disk full, read-only cache).  
**Who:** `saveShareJsonFile` / `loadShareJsonFile` heal path.  
**What to do:** Fix cache directory permissions; avoid `--no-cache` / read-only cache modes if you expect local share metadata.

## `cache_empty`

**Code:** `i18nprune.share.cache_empty`  
**Severity:** `warning`  
**When:** `share view` or `share delete` (or `delete --all`) ran without `--project` / `--report` and `share.json` has no rows for this project.  
**Who:** CLI `resolveShareCommandTarget` (`packages/cli/src/commands/share/resolveTarget.ts`).  
**What to do:** Run `i18nprune share upload --project` or `--report --from <file>`, then use `share list` / `share view` / `share delete`. Or pass a worker id directly (`share view --project <id>`).

## `stale_cache_row_removed`

**Code:** `i18nprune.share.stale_cache_row_removed`  
**Severity:** `warning`  
**When:** Upload skip probe (`GET /v1/projects/:id` or `/v1/reports/:id`) found the cached worker id is gone; core removed the stale `share.json` row and continues with a fresh upload.  
**Who:** `runShare` (`packages/core/src/share/ops/run.ts`).  
**What to do:** None — CLI lists removed ids as dim detail lines, then uploads. Not the same as `remote_project_not_found` on a failed view/upload.

## `cache_entry_not_found`

**Code:** `i18nprune.share.cache_entry_not_found`  
**Severity:** `warning`  
**When:** `share delete --project <id>` or `--report <id>` (or delete after picking an id) found **no matching row** in local `share.json`, but remote worker `DELETE` was still attempted (unless `--local-only`).  
**Who:** `runShareDelete`.  
**What to do:** Safe to ignore if you only wanted to remove a stale worker row. Use `share list` to see what is still cached locally.

## `remote_project_not_found`

**Code:** `i18nprune.share.remote_project_not_found`  
**Severity:** `warning` on idempotent **DELETE**; `error` on **view** or upload failure when the id is still missing after re-upload. Stale cache purge during upload uses `stale_cache_row_removed` instead.  
**When:** Worker returned **404** or **200** with `data.deleted: false` for a project id (already evicted, wrong id, or never uploaded).  
**Who:** `resolveShareRemoteDeleteOutcome`, `shareRemoteIssueFromWorker`, `runShare`.  
**What to do:** On delete, treated as done. On upload/view, remove the stale `share.json` row (`share delete --project <id>`) or run `share upload --project --force` to upload again.

## `remote_report_not_found`

**Code:** `i18nprune.share.remote_report_not_found`  
**Severity:** `warning` on idempotent **DELETE**; `error` on upload / view when the report id is gone.  
**When:** Same as `remote_project_not_found`, for report ids (`/v1/reports/:id`).  
**Who:** `resolveShareRemoteDeleteOutcome`, `shareRemoteIssueFromWorker`, `runShare`.  
**What to do:** Same as project — delete locally, re-share with `share upload --report --from <file>` if needed.

## `remote_payload_too_large`

**Code:** `i18nprune.share.remote_payload_too_large`  
**Severity:** `error`  
**When:** Project zip or report JSON exceeds worker limits (see `REPORT_SHARE_MAX_BYTES` in core).  
**Who:** `shareRemoteIssueFromWorker` after worker `POST`.  
**What to do:** Reduce snapshot size (exclude paths) or report payload; see worker upload error message.

## `remote_report_rejected`

**Code:** `i18nprune.share.remote_report_rejected`  
**Severity:** `error`  
**When:** Worker rejected report JSON (schema / size).  
**Who:** `shareRemoteIssueFromWorker`.  
**What to do:** Fix report document shape (`i18nprune.projectReport`); run `i18nprune report --format json` and share that file.

## `remote_upload_rejected`

**Code:** `i18nprune.share.remote_upload_rejected`  
**Severity:** `error`  
**When:** Worker rejected a project upload (`UPLOAD_*` codes) or other **400** bad request.  
**Who:** `shareRemoteIssueFromWorker`.  
**What to do:** Read worker `errors[].message`; fix zip/content limits.

## `remote_unavailable`

**Code:** `i18nprune.share.remote_unavailable`  
**Severity:** `error`  
**When:** Network failure, timeout, or worker **5xx** / **502** / **503** / **504**.  
**Who:** `shareRemoteIssueFromWorker` (CLI `workerFetchJson` sets `NETWORK_ERROR` on fetch throw).  
**What to do:** Retry later; check `I18NPRUNE_WORKER_URL` / `--worker-url`; verify worker health.

## `remote_error`

**Code:** `i18nprune.share.remote_error`  
**Severity:** `error`  
**When:** Unmapped worker HTTP/body failure (invalid JSON envelope, unexpected status).  
**Who:** `shareRemoteIssueFromWorker`.  
**What to do:** Inspect worker response; retry; report upstream if persistent.

## `snapshot_empty`

**Code:** `i18nprune.share.snapshot_empty`  
**Severity:** `error`  
**When:** Project share zip would contain no files after excludes.  
**Who:** `buildProjectPayload` / `runShare`.  
**What to do:** Widen `src` / scan includes; check exclude rules.

## `zip_failed`

**Code:** `i18nprune.share.zip_failed`  
**Severity:** `error`  
**When:** Local zip build failed (`fflate`).  
**Who:** `runShare` / `buildProjectPayload`.  
**What to do:** Check disk space and project file access; retry.

## Hosted prepare (`i18nprune.share.prepare_*`)

Codes from **`prepareShareHostedFromContext`**, **`prepareProjectSnapshotFromRoot`**, and **`prepareReportFromArchive`** before worker upload.

### `prepare_nothing_requested`

**Code:** `i18nprune.share.prepare_nothing_requested`  
**Severity:** `error`  
**When:** Combined prepare ran with both `wantProject` and `wantReport` false.  
**Who:** `prepareShareHostedFromContext`.  
**What to do:** Pass at least one of project or report prepare flags (CLI: `--project` and/or `--report` on `share upload`).

### `prepare_report_host_required`

**Code:** `i18nprune.share.prepare_report_host_required`  
**Severity:** `error`  
**When:** Report prepare was requested without `reportHost` (`cwd`, `toolVersion`, `environment`).  
**Who:** `prepareShareHostedFromContext`.  
**What to do:** Supply host metadata (CLI fills this from `process` / OS facts).

### `prepare_analysis_failed`

**Code:** `i18nprune.share.prepare_analysis_failed`  
**Severity:** `error`  
**When:** Cached analysis could not be applied to the snapshot (e.g. source locale shape).  
**Who:** `prepareProjectSnapshotFromRoot`, `prepareShareHostedFromContext`.  
**What to do:** Fix source locale and config paths; see also `i18nprune.project.source_locale_invalid_shape`.

### `prepare_report_from_archive_failed`

**Code:** `i18nprune.share.prepare_report_from_archive_failed`  
**Severity:** `error`  
**When:** Project zip prepare succeeded but building a report document from the extracted snapshot failed.  
**Who:** `prepareReportFromArchive` (`packages/core/src/project/prepare/fromArchiveReport.ts`).  
**What to do:** Ensure archive extraction completed (`snapshot.extraction` present); retry with a valid project zip or use live `prepareReportForShare` from disk instead of archive report mode.
