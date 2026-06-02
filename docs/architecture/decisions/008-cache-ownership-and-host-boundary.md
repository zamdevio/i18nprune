# ADR 008 — Cache ownership and host boundary

**Status:** Accepted  
**Date:** 2026-06-02  
**Related ADRs:** [ADR 006](./006-command-orchestrator-boundary.md), [ADR 010](./010-locale-layout-and-metadata-modes.md)

## Context

Project scan reuse (`files.json`, `analysis.json`), translation L2 (`translations/<code>.json`), and locale-write invalidation interact with every major command. Early work split hints between CLI and core; drift caused inconsistent rebuild behavior. v1 locked **policy in core** and **host wiring in CLI/IDE**.

## Decision

1. **Core owns** cache policy: `resolveCacheConfig`, `decideAnalysisRebuild`, `decideProjectAnalysisCacheInvalidation`, read/write under `packages/core/src/cache/**`.
2. **Hosts own** flags and adapters: `--no-cache`, `--debug-cache`, `--cache-profile`, `I18NPRUNE_HOME`, logger `[cache]` lines — CLI passes `CacheRuntime` into core; no forked delta logic in `packages/cli`.
3. **Explicit `cache.rebuild: 'full'`** in config overrides profile defaults → always full analysis scan; `--debug-cache` reports `full (config rebuild=full)`.
4. **Locale deltas** (from `decideAnalysisRebuild`):
   - Target locale only → **reuse** analysis arrays.
   - Source locale only → **partial** (`missingKeys` refresh, no full `src/**` walk).
   - Source + target together → **full** scan.
   - Layout fingerprint change → **full** scan.
5. **Same-run locale writes** (`sync` / `generate`) invalidate `analysis.json` for the next command in the process; target-only writes skip delete so the next dispatch can reuse scan arrays.
6. **Translate L1/L2** are for `generate` provider reuse only — not a substitute for locale JSON or `--resume`.

## Implementation

```ts
// packages/core/src/cache/rebuildPolicy.ts — decision entry
decideAnalysisRebuild({
  config: resolvedRebuildConfig,
  classified: fileDelta,
  hasPrevious: Boolean(analysisJson),
  trackedSrcCount,
});
```

```ts
cache: {
  profile: 'balanced',
  rebuild: 'full', // overrides profile → always full scan
}
```

## Consequences

### Positive

- CLI, SDK, and future IDE hosts share one rebuild story.
- `--debug-cache` lines map directly to `AnalysisRebuildReason` values.

### Negative

- Contributors must read core before adding “quick” cache shortcuts in CLI.
- WSL vs Windows native Node use different home paths — documented under [CLI cache](../../cli/cache.md).

### Mitigation

- [CLI cache](../../cli/cache.md) and [Cache config](../../config/cache.md) for operators.
- [Solved: locale layout mismatch rebuild](../../edge-cases/solved/locale-layout-mismatch-rebuild.md) for layout fingerprint cases.

## Alternatives Considered

### CLI-owned cache dispatch

- **Pros:** Faster to wire one command.
- **Cons:** SDK and worker hosts would diverge; already rejected in tree refactors (T5).

### No disk cache (always full scan)

- **Pros:** Simplest mental model.
- **Cons:** Unacceptable on large monorepos; partial rebuild shipped in Phase 2–4.

## References

- [CLI cache](../../cli/cache.md)
- [Cache config](../../config/cache.md)
- [Solved: locale layout mismatch rebuild](../../edge-cases/solved/locale-layout-mismatch-rebuild.md)
- Git: `02653b7` locale-aware rebuild; `71b9190` target-only invalidation skip; `58e9f32` profiles; `2ab8b17` types in `types/cache`
