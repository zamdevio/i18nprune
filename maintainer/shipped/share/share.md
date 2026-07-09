# Share & workers (2026-W22)

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **Share (C.3+)** | `runShare` + list/view/delete + worker CRUD + CLI `share` | [`systems/share.md`](../../systems/share.md) |
| **Share hardening (6b)** | `share.bak/`, cache-epoch skip, view 404 purge | [`issues/share`](../../../docs/issues/share.md) |
| **Worker hardening (6c)** | Archive ingest, rate limit, storage eviction | [`runtime/worker`](../../../docs/runtime/worker.md) |
| **Web share UX (7)** | `/#/workspace?id=` hydrate | [`commands/share`](../../../docs/commands/share/README.md) |
| **Report share UX (8)** | `/#/?id=` hydrate, `@i18nprune/ui` shell | [`systems/ui.md`](../../systems/ui.md) |
| **Worker report route (9)** | `GET /v1/projects/:id/report` | [`systems/share.md`](../../systems/share.md) |
| **Worker metadata (W)** | Canonical metadata grouping, `edge-worker` family | [`runtime/worker`](../../../docs/runtime/worker.md) |
