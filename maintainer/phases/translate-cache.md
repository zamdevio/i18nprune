# Translate cache phase — provider result reuse (**planned**)

**Status:** **Planned** — implement **after** **[`cache.md`](./cache.md)** (Session **H-cache**) incremental analysis rebuild lands (Phases 0–3 minimum).  
**Dependency:** **Locales (H)** — **shipped** (segment-aware **`files.json`**, row **10**). **Cache** — [`cache.md`](./cache.md) (stable `analysis.json` + dispatch policy).  
**Does not block:** Cache incremental work; start **H.1** when [`cache.md`](./cache.md) tracker marks config policy **Done** or explicitly deferred.

Canonical ordering: **[`V1-RELEASE.md` § Recommended sequence](./V1-RELEASE.md#recommended-v1-sequence-start-here-after-shipped-session-c)** · locked chain update in **[`active-phase.md`](./active-phase.md#locked-cross-phase-dependency-chain)**.

---

## Goal

Speed up **`generate`** (and any core path that calls **`translateLeaf`**) by caching **provider translation results**, without changing user-facing parity for locale JSON writes or stable **`issues[]`** codes.

Two layers:

| Layer | Scope | Lifetime | Purpose |
|-------|--------|----------|---------|
| **L1 — per-run (in-memory)** | Single CLI / SDK process | Process exit | Dedupe identical source strings within one run (many keys, same English text). |
| **L2 — per-project (disk)** | `~/.i18nprune/cache/projects/<projectId>/` | Cross-run | Reuse provider results when inputs unchanged; lives **beside** existing project cache slots. |

**Not a replacement for `generate --resume`:** Resume skips leaves already persisted in target locale JSON. Translation cache skips **network/provider** work when the same masked source text was translated before under the same policy epoch.

---

## On-disk layout (beside project analysis cache)

Existing project cache dir (core: `packages/core/src/cache/setup/paths.ts`):

```txt
~/.i18nprune/cache/projects/<projectId>/
├── files.json          # input fingerprint index (must include all locale segments after H)
├── analysis.json       # key-site scan slot (existing)
└── translations.json   # NEW — L2 translation result store (this phase)
```

**Rule:** `translations.json` is a **sibling** of `analysis.json` under the same `projectDir`, governed by the same project cache enablement and invalidation epoch as other slots. See **[`cache.md`](./cache.md)** for analysis rebuild policy (`cache.rebuild`, partial patch).

Optional future: shard `translations/` directory if payload size exceeds **`cache` oversize** guards — v1 may start with a single `translations.json` and split only if needed.

---

## Shared cache policy (no second config surface)

Translation cache **reuses** the existing project cache policy — **no** separate `translate.cache` block in v1.

| Control | Applies to L2 | Applies to L1 |
|---------|---------------|---------------|
| `config.cache.enabled === false` | Bypass read/write | In-memory may still run (cheap); optionally bypass for consistency — **default: L1 allowed when disk cache disabled** |
| `config.cache.mode === 'readOnly'` | Read hits; no writes | Unaffected |
| CLI/global `--no-cache` | Bypass (same as `cli_no_cache`) | Same host flag; recommend bypass L1 when `--no-cache` for predictable “cold run” |
| `config.cache.dir` | Same root / `projectDir` | N/A |
| Cache disable reasons (`project_root_missing`, `cache_dir_unavailable`, …) | Same graceful disable | N/A |
| `CoreContext.cache` / `baselineFiles` | Share **`files.json`** epoch for invalidation | N/A |

Hosts continue to wire **`initializeCacheState`** / **`CacheRuntime`**; generate (and resume) consult translation cache inside **`translateLeaf`** orchestration or a thin wrapper used only from generate paths.

**Schema doc update (this phase):** extend `cacheSchema` `.describe()` in `packages/core/src/config/schema/root.ts` to state that **`cache` also governs translation result persistence** — behavior only; no new keys required for v1.

---

## Cache key (L2 entry identity)

Entries are keyed by a stable digest of **translation inputs**, not by locale leaf path (same English string in two segment files → one cache entry).

**Include in digest:**

- Masked source text (post-`mask()`, pre-provider) — same pipeline as **`translateLeaf`**
- `sourceLang`, `targetLang`
- Active `providerId` (and provider-specific options epoch when model/prompt affects output)
- **`translateConfigEpoch`** — hash of relevant `config.translate` fields (provider order, model ids, glossary flags, …)

**Exclude from digest:**

- `segmentRelativePath`, `logicalPath` (leaf placement is a write concern; cache is text-level)
- Target locale file path

**Invalidate L2 when:**

- `files.json` delta changes any tracked locale segment or source locale content (after locales phase: all segments under `locales.directory`)
- `translateConfigEpoch` changes
- Explicit bypass: `generate --force`, host “no translation cache” debug flag (if added), `--no-cache`

---

## L1 — per-run memo

- **Structure:** `Map<digest, TranslationResult>` (or text + metadata subset) owned by generate translation pool / `runOrderedTranslateStringJobs`.
- **Scope:** Single run, all targets in that process.
- **Policy:** Honor `--no-cache` bypass for both layers when set; otherwise always on (low risk).
- **Slice:** Can land in the same PR as L2 or one PR earlier after locales.

---

## L2 — per-project store

**Payload (illustrative):**

```ts
{
  version: number;
  updatedAt: string;
  translateConfigEpoch: string;
  entries: Record<digest, {
    text: string;
    leafMeta?: …;           // optional; regenerate heuristics if omitted
    providerId: string;
    createdAt: string;
  }>;
}
```

**Flow:**

1. Before `translateLeaf` network call: lookup L1 → L2 (if cache enabled).
2. On miss: call provider; on success write L1 + L2 (unless readOnly / no-cache).
3. **`generate --resume`:** unchanged eligibility rules; cache only avoids duplicate API calls for strings still needing translation.

**Size guards:** Reuse **`MAX_PROJECT_FILES_BYTES`**-style limits or add **`MAX_TRANSLATIONS_CACHE_BYTES`** constant; oversize → warn + disable translation cache for run (mirror `cache_oversize`).

---

## Relationship to locales phase

| Locales deliverable | Why translate-cache needs it |
|--------------------|------------------------------|
| Segment enumeration | Know every JSON file that affects invalidation |
| `files.json` includes all locale segments | Stale translation cache after any segment edit |
| `source` on leaves | Write-back unchanged; cache does not drive placement |
| `locale_read_path_layout_mismatch` | Only valid segments contribute to fingerprints |

See [`locales.md` § Risks](./locales.md#risks) — disk cache fingerprinting item is a **prerequisite** for L2, implemented in locales (or a small cache-dispatch PR at end of H).

---

## Implementation tracker

| # | Task | Status |
|---|------|--------|
| 0 | Locales phase: segment-aware `files.json` / `buildCurrentFileRecords` | **Todo** (locales **H**) |
| 1 | `CacheState.translationsPath` + path resolution beside `analysis.json` | **Todo** |
| 2 | `translateConfigEpoch` helper + unit tests | **Todo** |
| 3 | L1 per-run memo in generate translation pool | **Todo** |
| 4 | L2 `translations.json` load/save + invalidation vs `files.json` epoch | **Todo** |
| 5 | Wire lookup/write in `translateLeaf` or generate-only wrapper | **Todo** |
| 6 | Respect `cache.enabled`, `cache.mode`, `--no-cache`; bypass on `--force` | **Todo** |
| 7 | Tests: hit/miss, stale after source edit, readOnly, no-cache, config disable | **Todo** |
| 8 | Maintainer + user docs (`docs/cache/`, generate README) | **Todo** |

**PR slice discipline:** L1 alone is acceptable first PR after locales; L2 + invalidation second; docs third.

---

## Non-goals (translate-cache phase)

- Global cross-project translation cache (same string, different repos).
- Caching provider **errors** as successes (only successful `TranslationResult` rows).
- Replacing **`generate --resume`** or partial locale JSON on disk.
- New CLI flags beyond existing **`--no-cache`** (unless debug-only later).
- Bypassing provider ToS — document that operators are responsible for API caching rules.

---

## Risks

- **Stale translations** if `files.json` misses a segment path → wrong language in locale files (mitigate: locales enumeration in cache dispatch).
- **Privacy:** translated strings at rest under `~/.i18nprune/cache/` (document in user cache docs).
- **Provider drift:** model updates without `translateConfigEpoch` bump → rare stale hits (mitigate: include model id in epoch).

---

## Extension / SDK

Extension and SDK hosts use the same core generate path; translation cache is **core-owned**, not host-duplicated. Extension does not need a separate cache directory.
