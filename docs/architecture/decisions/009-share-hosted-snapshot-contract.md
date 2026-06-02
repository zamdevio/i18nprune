# ADR 009 — Share hosted snapshot contract

**Status:** Accepted  
**Date:** 2026-05-20  
**Deciders:** Abdisamed Mohamed  
**Related ADRs:** [ADR 008](./008-cache-ownership-and-host-boundary.md), [ADR 011](./011-runtime-neutral-sdk-host-model.md)

## Context

Teams need to upload **prepared project snapshots** and **report JSON** to a public worker for review links, without baking worker HTTP into core algorithms. Share also maintains local **`share.json`** beside the project cache for list/view/delete ergonomics.

## Decision

1. **Core owns** orchestration: `prepareProjectSnapshotFromRoot`, payload build, content-hash semantics, `share.json` I/O, re-upload policy (`packages/core/src/share/**`).
2. **CLI is a thin host:** confirm gate (TTY), `--yes` / `--json` auto-upload, HTTP to `workers.i18nprune.dev`, human lines via emit helpers.
3. **Two upload routes:** prepared JSON envelope (`POST /v1/projects`) and zip archive (`POST /v1/projects/archive`) for browser/edge hosts without disk cache.
4. **Content-hash dedup:** worker may return `HASH_ALREADY_EXISTS` and reuse ids; `--force` replaces the row for that hash (old URLs 404). Local cache records the latest id either way.
5. **Separate from CLI disk cache:** `~/.i18nprune/cache/` is not worker storage; `--no-cache` disables `share.json` read/write but does not block upload when ids are passed manually.
6. **Stable issue namespace:** `i18nprune.share.*` mapped from worker codes — see [Share issues](../../issues/share.md).

## Implementation

```bash
# Default: reuse remote id when payload hash unchanged
i18nprune share upload --project

# New worker row for same content hash (old links stop working)
i18nprune share upload --project --force

# CI: no TTY confirm
i18nprune share upload --project --json
```

## Consequences

### Positive

- Same prepare logic for CLI upload and programmatic `runShare` consumers.
- Hash dedup saves bandwidth; `--force` is explicit when links must rotate.

### Negative

- 7-day idle retention on the public worker — not a long-term archive.
- Large snapshots hit worker size limits (`PAYLOAD_TOO_LARGE`, extraction caps).

### Mitigation

- [Share command](../../commands/share/README.md) operator table.
- [Solved: share hash dedup and force replace](../../edge-cases/solved/share-hash-dedup-and-force-replace.md).

## Alternatives Considered

### CLI-only share (no core module)

- **Pros:** Smaller core package.
- **Cons:** Web/worker hosts could not reuse prepare/zip logic; rejected during share hardening (6b).

### Always upload (no hash dedup)

- **Pros:** Simpler mental model.
- **Cons:** Wastes quota; worker already content-addresses storage.

## References

- [Share command](../../commands/share/README.md)
- [Share issues](../../issues/share.md)
- [Worker / edge runtime](../../runtime/worker.md)
- [Solved: share hash dedup and force replace](../../edge-cases/solved/share-hash-dedup-and-force-replace.md)
- Git: share layout `ops/` + `cache/` + `payload/`; `fae28d7` hosted metadata types
