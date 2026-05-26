# Share ecosystem — systems note

**Audience:** Maintainers and agents touching **share** across core, CLI, web, report, or the hosted worker (`apps/workers/i18nprune`).  
**Audience is not:** end users (`docs/commands/share/`, `docs/runtime/worker.md`).  
**Companion:** [`operations/entrypoints.md`](./operations/entrypoints.md) · [`ui.md`](./ui.md) for worker `/docs` Swagger shell · [`maintainer/phases/worker.md`](../phases/worker.md) for metadata response polish slices · [`maintainer/phases/apps.md`](../phases/apps.md) for C.3 web/report catch-up.

---

## Purpose

**Share** is the cross-surface flow for publishing **prepared project snapshots** and **report documents** to a hosted worker, then consuming them via stable IDs and links. This note maps how the pieces connect — not a duplicate of user-facing share command docs.

---

## Share surfaces (hosts)

| Surface | Role | Primary paths |
|---------|------|----------------|
| **Core** | `runShare`, `runShareList`, `runShareView`, `runShareDelete`; payload prepare; remote issue mapping | `packages/core/src/share/` |
| **CLI** | `i18nprune share` (`upload`, `list`, `view`, `delete`) | `packages/cli/src/commands/share/` |
| **Web** | Workspace `/#/workspace?id=`, link-only when already remote, prepared upload | `apps/web/src/` |
| **Report** | Report import + share when bound to worker `reportId` | `apps/report/` |
| **Worker** | `workers.i18nprune.dev` — store, dedup, read-only ops on cached snapshot | `apps/workers/i18nprune/` |
| **Extension** | *Planned* — fourth host after core share + extension foundation (see [`maintainer/phases/extension/post-mvp.md`](../phases/extension/post-mvp.md)) | `apps/extension/` |

**Out of scope here:** `apps/workers/meta` (metadata API only; no project/report share rows unless explicitly scoped).

---

## End-to-end flow

```txt
Local project / report
  → core prepare (snapshot or document JSON, optional zip archive)
  → host uploads (CLI / web / future extension)
  → worker POST /v1/projects | /v1/reports (+ /archive variants)
  → ProjectStoreDO (7-day idle TTL, hash dedup, rate limits)
  → consumers: GET metadata, GET snapshot/document, read-only derived routes
```

CLI/web/report parse worker envelopes and map errors through **`packages/core/src/share/remote`** into stable share **issue codes**.

---

## Hosted worker (`apps/workers/i18nprune`)

### Status

- **Lifecycle:** evolving; public route names and worker error codes are compatibility surfaces.
- **Last reviewed:** 2026-05 (share systems split from worker-only note).

### Scope

| In scope | Out of scope |
|----------|--------------|
| `apps/workers/i18nprune/src/routes/v1/**` | Accounts, ACLs, teams, private hosted storage |
| `ProjectStoreDO` storage, retention, rate limit, pressure recovery | Worker-side `sync`, `generate`, `cleanup`, or mutation of user projects |
| Worker OpenAPI and `/docs` Swagger shell | `apps/workers/meta` product API (separate worker) |
| Route contracts consumed by CLI/web/report share | Long-lived analysis cache on the edge |
| Core metadata builders for GET/POST responses | Node-only adapter behavior in worker routes |

### Primary artifacts

| Concern | Path |
|---------|------|
| Worker app entry | [`apps/workers/i18nprune/src/index.ts`](../../apps/workers/i18nprune/src/index.ts) |
| Route registration | [`apps/workers/i18nprune/src/routes/index.ts`](../../apps/workers/i18nprune/src/routes/index.ts), [`routes/v1/index.ts`](../../apps/workers/i18nprune/src/routes/v1/index.ts) |
| Durable Object storage | [`apps/workers/i18nprune/src/lib/do.ts`](../../apps/workers/i18nprune/src/lib/do.ts) |
| Project routes | [`apps/workers/i18nprune/src/routes/v1/projects`](../../apps/workers/i18nprune/src/routes/v1/projects) |
| Report routes | [`apps/workers/i18nprune/src/routes/v1/reports`](../../apps/workers/i18nprune/src/routes/v1/reports) |
| Worker envelopes | [`apps/workers/i18nprune/src/response/index.ts`](../../apps/workers/i18nprune/src/response/index.ts) |
| Rate limits | [`apps/workers/i18nprune/src/lib/rateLimit`](../../apps/workers/i18nprune/src/lib/rateLimit) |
| Retention / keys | [`apps/workers/i18nprune/src/lib/constants`](../../apps/workers/i18nprune/src/lib/constants) |
| Storage pressure | [`apps/workers/i18nprune/src/lib/storage`](../../apps/workers/i18nprune/src/lib/storage) |
| OpenAPI | [`apps/workers/i18nprune/src/openapi.ts`](../../apps/workers/i18nprune/src/openapi.ts) |
| Project metadata builder | [`packages/core/src/project/storedMetadata.ts`](../../packages/core/src/project/storedMetadata.ts) |
| Report metadata builder | [`packages/core/src/project/reportMetadata.ts`](../../packages/core/src/project/reportMetadata.ts) |
| Metadata types | [`packages/core/src/types/project/metadata.ts`](../../packages/core/src/types/project/metadata.ts), [`reportStore.ts`](../../packages/core/src/types/project/reportStore.ts) |
| CLI HTTP client | [`packages/cli/src/commands/share/workerHttp.ts`](../../packages/cli/src/commands/share/workerHttp.ts) |
| Core remote mapping | [`packages/core/src/share/remote`](../../packages/core/src/share/remote) |

### Decisions

| Topic | Decision |
|-------|----------|
| **One public share worker** | `workers.i18nprune.dev` hosts project snapshots and report documents. |
| **One Durable Object class** | `ProjectStoreDO` stores `project:*` and `report:*` rows, hash indexes, rate limits, retention alarms. |
| **Worker is read-focused** | Hosted read ops (`validate`, `review`, `missing`, `locales`, `doctor`, `report`) from cached snapshot; writes stay CLI/extension-local. |
| **No edge analysis cache** | Upload does not read/write `.i18nprune/cache`; stores prepared snapshots/documents only. |
| **Metadata routes** | `GET /v1/projects/:id` and `GET /v1/reports/:id`; bodies at `/snapshot` and `/document`. |
| **Core-owned metadata** | Routes call `buildProjectStoredMetadata` / `buildStoredReportMetadata` — no ad hoc route JSON. |
| **Retention** | 7-day idle TTL; reads touch `lastAccessedAt`. |
| **Dedup** | `projecthash:*` / `reporthash:*` unless `?force=true` on upload. |
| **Errors** | Structured worker codes → core share issues for CLI/web/report. |
| **Privacy** | Prepared snapshots / sanitized archives / report JSON — not opaque full-repo storage. |

### Route contract

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/` | Service discovery links. |
| `GET` | `/health` | Liveness probe. |
| `GET` | `/v1/capabilities` | Read/write policy for hosts. |
| `POST` | `/v1/projects` | Store prepared project snapshot JSON. |
| `POST` | `/v1/projects/archive` | Zip → prepared snapshot on worker. |
| `GET` | `/v1/projects/:id` | Project metadata only. |
| `GET` | `/v1/projects/:id/snapshot` | Full snapshot. |
| `DELETE` | `/v1/projects/:id` | Delete project row. |
| `GET` | `/v1/projects/:id/{tree,validate,review,missing,locales,doctor,report}` | Read-only ops from snapshot. |
| `POST` | `/v1/reports` | Store report document JSON. |
| `POST` | `/v1/reports/archive` | Zip → report document on worker. |
| `GET` | `/v1/reports/:id` | Report metadata only. |
| `GET` | `/v1/reports/:id/document` | Full report document. |
| `DELETE` | `/v1/reports/:id` | Delete report row. |
| `GET` | `/openapi.json`, `/docs` | API schema and Swagger UI. |

---

## Frozen API notes

- Public route names and top-level worker envelope fields are compatibility surfaces.
- Public worker error codes must stay mapped in core share issue handling.
- Metadata response changes: additive-first unless a worker phase plans a versioned break.
- Prefer `null` or omission over display placeholders (`—`) in new machine fields.

---

## Cross-links

- **Apps / share phase:** [`maintainer/phases/apps.md`](../phases/apps.md)
- **Worker metadata polish:** [`maintainer/phases/worker.md`](../phases/worker.md)
- **Shipped slices:** [`maintainer/phases/shipped-slices.md`](../phases/shipped-slices.md)
- **User docs:** [`docs/commands/share/README.md`](../../docs/commands/share/README.md) · [`docs/runtime/worker.md`](../../docs/runtime/worker.md)

---

## Change discipline

- Update **this file** when share wiring changes across core, CLI, web, report, or worker routes/storage/metadata/errors.
- Update [`maintainer/phases/worker.md`](../phases/worker.md) only for planned worker **response-shape** slices.
- Update user docs (`docs/commands/share/`, `docs/runtime/worker.md`) for behavior visible to operators.
- Update [`shipped-slices.md`](../phases/shipped-slices.md) only when a slice is actually closed.
