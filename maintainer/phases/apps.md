# Apps phase — remaining work (C.3+)

**Status:** **Active** — share rows **0–7**, **6b**, **6c**, **10** are **shipped** ([`shipped-slices.md`](./shipped-slices.md)).  
**Hub:** [`V1-RELEASE.md`](./V1-RELEASE.md) Session **C.3** · **Systems map:** [`maintainer/systems/share.md`](../systems/share.md) · **Active narrative:** [`active-phase.md`](./active-phase.md).

**For agents:** read [`maintainer/systems/share.md`](../systems/share.md) for current wiring. This file is **only open tasks** — no re-implementing shipped slices.

**PR discipline:** one tracker row per PR · `pnpm typecheck` · `pnpm test` · `pnpm vitest run tests/parity` when CLI output changes.

---

## Tracker (open only)

| # | Slice | Status | Notes |
|---|-------|--------|-------|
| **8** | **Report** `/#/?id=` + `/document` load + Share + error UX | **Shipped** | [`apps/report`](../../apps/report) — deep link, worker hydrate, share upload / link-only |
| **9** | Worker **`runReport`** on `GET …/projects/:id/report` | **Todo** | Replace hand-built doc in `routes/v1/projects/report.ts` |
| **W** | **Worker metadata response polish** | **Todo** (can parallel 8/9) | Compressed plan § [Worker metadata (W)](#worker-metadata-w) below |

---

## Row 8 — `apps/report` (next PR)

**URL:** `https://report.i18nprune.dev/#/?id={workerReportId}` (hash + query; no `/s/:id`).

| Task | Detail |
|------|--------|
| Deep link | `parseReportShareId` (URL or raw 16-char id) |
| Hydrate | `GET /v1/reports/:id` probe → `GET /v1/reports/:id/document` + schema validate |
| Errors | `shareRemoteIssueFromWorker` — 404 eviction banner, upload too large / invalid, 5xx |
| Share | `source: 'worker'` → **link-only** (no re-upload); paste/file → `POST /v1/reports` |
| UI | Shell align with web; “Open shared link” on import; dev worker URL setting |
| Core | `buildReportShareUrl` in `packages/core/src/share/util/links.ts` |

---

## Row 9 — worker project report route

- [ ] `apps/workers/i18nprune/src/routes/v1/projects/report.ts` calls **`runReport`** with edge adapters (no hand-built document).

---

## Worker metadata (W)

**Goal:** Grouped, versioned metadata on **GET/POST** project + report routes — core builders, thin worker routes. **No** route-local JSON composition.

**Principles:** core owns shape · additive-first (keep legacy top-level fields) · `null`/omit not `—` for machine timings · `summary` block for web/report dashboards · no JSON soup.

**Routes (same shape on GET + successful POST, including `/archive`):**

| Route | Target |
|-------|--------|
| `GET/POST` project | `GET /v1/projects/:id`, `POST /v1/projects`, `POST /v1/projects/archive` |
| `GET/POST` report | `GET /v1/reports/:id`, `POST /v1/reports`, `POST /v1/reports/archive` |

**Target grouping** (`schemaVersion: 1` + optional `requestId` / `traceId`):

`summary` · `artifact` · `execution` · `analysis` · `cache` · `timing` · `storage` · `retention` · `capabilities`

Legacy fields (`projectId`, `reportId`, `expiresAt`, `timing`, `processor`, `extraction`, …) stay until consumers migrate.

**Field groups (short):**

- **summary** — dashboard facts (files, locales, observations, `surface`, cache mode, report `ok`).
- **artifact** — ids, hashes, byte sizes, `localeTags`, schema/tool version.
- **execution** — `surface`, `host`, `route` (`prepared` vs `archive`), `transport`, `computeLocation` (`client` vs `edge`).
- **analysis** — config hash, paths, key/dynamic counts (not mixed with cache).
- **cache** — prepare-time only (`hit` / `disabled`, `filesEpoch`, `trustworthyTimings`).
- **timing** — ISO timestamps + `prepare.*` + `edge.persistMs`; no string placeholders.
- **storage** — `durable-object`, dedup/content-addressed flags.
- **retention** — `idle-7d`, `expiresAt`, `lastAccessedAt`.
- **capabilities** — `preparedUploads`, `archiveUploads`, `readOperations[]`, report vs project flags.

**Tasks:**

| Step | Work |
|------|------|
| **W0** | Inventory consumers of `ProjectStoredMetadata` / `StoredReportMetadata`; CLI `share view`, web workspace, report import — confirm additive tolerance |
| **W1** | Grouped types in `types/project/metadata.ts` + builders; legacy fields preserved; drop `METADATA_DASH` for new timing fields |
| **W2** | `buildProjectStoredMetadata` + tests (prepared + archive); verify `GET /v1/projects/:id` envelope |
| **W3** | `buildStoredReportMetadata` + tests; verify `GET /v1/reports/:id` |
| **W4** | POST success payloads match GET metadata; dedup (`HASH_ALREADY_EXISTS`) same shape + warning |
| **W5** | Optional `requestId` / `snapshotId` / `documentId` / `traceId` only if useful for logs |
| **W6** | `openapi.ts` examples + `docs/runtime/worker.md`; snapshot tests; `docs/commands/share` only if CLI output changes |

**Code map:** `packages/core/src/project/storedMetadata.ts` · `reportMetadata.ts` · `types/project/metadata.ts` · `types/project/reportStore.ts` · `share/remote/parseMetadata.ts` · `apps/workers/i18nprune/src/routes/v1/{projects,reports}/` · `openapi.ts`

**Done when:** GET + POST share grouped metadata; strict timings; OpenAPI updated; CLI/web/report still work during migration.

---

## Upload size limits (reference)

**Canonical constants** (worker + web prepare + CLI share use the same caps):

| Constant | Location | Values |
|----------|----------|--------|
| **`PROJECT_UPLOAD_ZIP_LIMITS`** | `packages/core/src/shared/constants/project.ts` | **50 MiB** zip · **15_000** files · **60 MiB** total text |
| **`PROJECT_SHARE_PREPARED_MAX_BYTES`** | `packages/core/src/shared/constants/share.ts` | **50 MiB** prepared project JSON (`POST /v1/projects`) |
| **`REPORT_SHARE_MAX_BYTES`** | `packages/core/src/shared/constants/share.ts` | **8 MiB** report JSON (`POST /v1/reports`) |

**Enforcement:**

- **Web local zip preview / prepare:** `parseZipToSnapshot` → `PROJECT_UPLOAD_ZIP_LIMITS` (`apps/web/src/project/mergeZipConfig.ts`).
- **Web/CLI worker upload (zip):** `buildProjectPayload` / `collectSnapshotPaths` pre-checks zip limits; worker returns `UPLOAD_ZIP_TOO_LARGE` / etc. → `share_remote_payload_too_large`.
- **Web/CLI worker upload (prepared JSON):** `assertHostedProjectPreparedWithinLimit` in `buildPreparedProjectPayload` / `buildHostedProjectShareArtifacts` before POST.
- **Report upload:** `assertReportShareWithinLimit` in `validateReportIngest`; worker `REPORT_PAYLOAD_TOO_LARGE` → `share_remote_report_rejected`.

**Web-only (IndexedDB recent zips — not worker limits):** `apps/web/src/storage/recentProjectZips.ts` — default **512 MiB** total quota (`maxTotalMb`), **1000** max zip count; user-configurable in Settings. Oversize zips can still open workspace but may skip cache with a warning.

**UX copy (web row 7 / report row 8):** surface `share_remote_payload_too_large` with **50 MiB zip** (and file/text caps from constants above), not ad-hoc strings.

---

## Quick code map

| Concern | Path |
|---------|------|
| Share op | `packages/core/src/share/` |
| Upload limits | `packages/core/src/shared/constants/project.ts`, `share.ts` |
| Worker DO + routes | `apps/workers/i18nprune/src/lib/do.ts`, `routes/v1/` |
| Web | `apps/web/src/{worker,project,workspace,storage}/` |
| Report | `apps/report/src/data/loader/` |
