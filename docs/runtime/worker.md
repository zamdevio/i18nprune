# Worker / edge runtime

**Import:** `i18nprune/core/runtime/edge`

Workers (Cloudflare Workers, AWS Lambda@Edge-style isolates, Deno Deploy, etc.) impose **strict bundle limits**, **no persistent POSIX filesystem**, and **no `node:` modules** unless explicitly polyfilled by the platform.

## Why `runtime/edge` exists

| Constraint | Impact |
|------------|--------|
| **Bundle graph audits** | Publishable graphs must tree-shake cleanly—accidentally importing **`runtime/node`** pulls forbidden **`node:`** symbols |
| **Filesystem semantics** | Reads/writes flow through virtual adapters (`KV`, `R2`, ephemeral `/tmp`, HTTP uploads) rather than raw **`fs.readFileSync`** |
| **Lifetime** | Runs last milliseconds—progress UX differs from CLI |

This package targets Tier **A** workloads first (`README.md`): **`validate`**, **`review`**, **`quality`**, **`report`** ingestion where payloads arrive via HTTP rather than disk scans.

## Hosting **`workers.i18nprune.dev`**

The **`apps/workers/i18nprune`** app packages **`runtime/edge`** for Cloudflare Workers. It stores **shared project snapshots** and **shared report documents** in a global Durable Object (`ProjectStoreDO`).

### Ingest routes

| Method | Route | Body | Who prepares |
|--------|-------|------|--------------|
| `POST` | `/v1/projects` | JSON prepared envelope | **Host** (CLI `share upload`, SDK, web) |
| `POST` | `/v1/projects/archive` | multipart zip (+ optional `configJson`) | **Worker** (`prepareProjectSnapshotFromArchive`, cache OFF) |
| `POST` | `/v1/reports` | `{ document }` | **Host** |
| `POST` | `/v1/reports/archive` | zip (same shape as project) | **Worker** (`prepareReportFromArchive`) |

The worker **does not** read your repo’s `.i18nprune/cache` or run long-lived analysis cache on the edge.

### Read / delete

| Method | Route | Returns |
|--------|-------|---------|
| `GET` | `/v1/projects/:id` | Metadata only (timings, `localeTags`, extraction summary) |
| `GET` | `/v1/projects/:id/snapshot` | Full cached snapshot (heavy) |
| `DELETE` | `/v1/projects/:id` | Evict row |
| `GET` | `/v1/reports/:id` | Report metadata |
| `GET` | `/v1/reports/:id/document` | Full `ProjectReportDocument` |
| `DELETE` | `/v1/reports/:id` | Evict row |

There is **no** `/metadata` suffix — the metadata GET **is** `GET /v1/projects/:id` (and the report equivalent).

### Retention

- Rows are kept while they receive reads (including metadata GETs).
- **7 days** without reads → idle sweep deletes `project:*`, `report:*`, and hash index keys.
- Missing ids return **`PROJECT_NOT_FOUND`** / **`REPORT_NOT_FOUND`** with guidance to re-upload (not a separate “expired payload” code).

Upload responses and metadata include **`expiresAt`** derived from last access.

### Limits and errors

Responses use a structured envelope (`success`, `code`, `errors[]` with `code`, `message`, `action`, optional `suggestions`).

| Code | Typical HTTP | `action` hint |
|------|--------------|---------------|
| `PAYLOAD_TOO_LARGE` / `TOO_MANY_FILES` / `EXTRACTION_LIMIT_EXCEEDED` | 413 | `reduce_payload` |
| `PAYLOAD_REJECTED` / `INVALID_SCHEMA` | 400 | `fix_payload` |
| `RATE_LIMITED` | 429 | `retry` (per-IP upload quota) |
| `HASH_ALREADY_EXISTS` | 200 + warning | Reused existing row for same content hash |
| `STORAGE_QUOTA_EXCEEDED` | 507 | `self_host` |
| `PROJECT_NOT_FOUND` / `REPORT_NOT_FOUND` | 404 | `reupload` |

**Force replace:** `?force=true` or JSON `"force": true` on ingest skips dedup, deletes the prior row for that content hash, and stores a **new** id (hash unchanged).

CLI mapping: [`share` command](../commands/share/README.md) and [share issue codes](../issues/share.md).

### Timings on project metadata

`GET /v1/projects/:id` includes a `timing` block:

- **`preparedAt`** — payload ready to persist (host prepare or worker zip + extraction finished)
- **`requestReceivedAt`** — worker received the ingest request
- **`storedAt`** — durable object write completed
- **`prepare.*`** — zip parse / analysis / extraction ms (measured or derived)
- **`extraction.*`** — extraction window ISO + duration
- **`edge.persistMs`** — measured DO persist latency

Top-level **`preparedAt`** mirrors `timing.preparedAt`. Older stored rows may still use snapshot `uploadedAt`; current core reads both.

### Privacy

Uploads are **prepared snapshots** (sanitized zip or JSON envelope) or **report JSON** — not opaque full-repo uploads. See [`share`](../commands/share/README.md) for what enters the payload.

## Bundle checklist

1. Run **`pnpm`** builds with **`NODE_OPTIONS=--conditions worker`** (or host-specific presets) when applicable.
2. Add CI guards rejecting **`node:`** imports on Worker graphs once finalized.

See [`README.md`](./README.md) for tier comparisons and [`node.md`](./node.md) / [`web.md`](./web.md) for sibling adapters.
