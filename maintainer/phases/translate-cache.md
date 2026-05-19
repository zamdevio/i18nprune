# Translate cache phase — provider result reuse (**shipped**)

**Status:** **Shipped (H.1)** — L1 + per-locale L2 on `main`.

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

## Core layout (shipped L1)

Translation cache lives under the **translator** system (not a top-level op):

| Artifact | Path |
|----------|------|
| L1 memo + wrapper | `packages/core/src/translator/cache/` (`l1Memo.ts`, `invokeWithL1.ts`, `resolveL1.ts`, …) |
| Cache key + epoch | `cacheKey.ts`, `translateConfigEpoch.ts` |
| Public types | `packages/core/src/types/translator/cache.ts` (barrel: `types/translator/index.ts`) |
| Generate wiring | `generate/localeTranslate.ts` → `runOrderedTranslateStringJobs`; memo from `runGenerate` |

Barrel: `translator/cache/index.ts` · re-exported from `translator/index.ts`.

Types: `types/translator/cache.ts` (**`TranslateCacheL1Port`**, **`TranslateCacheL2Port`**, disk envelopes) — implementations must not import types from classes (no circular deps).

---

## On-disk layout (beside project analysis cache)

Existing project cache dir (core: `packages/core/src/cache/setup/paths.ts`):

```txt
~/.i18nprune/cache/projects/<projectId>/
├── files.json          # input fingerprint index (all locale segments)
├── analysis.json       # key-site scan slot
└── translations/       # L2 per-target translation cache (generate)
    └── <code>.json     # one file per target locale
```

**Rule:** `translations/<code>.json` files live under the same `projectDir` as `analysis.json`, governed by the same project cache enablement and `inputFilesEpoch` invalidation. See **[`cache.md`](./cache.md)** for analysis rebuild policy.

---

## Cache key (L2 entry identity)

Entries are keyed by a stable digest of **translation inputs**, not by locale leaf path (same English string in two keys → one cache entry **per target file**).

**Include in digest (per `translations/<target>.json`):**

- Masked source text (post-`mask()`, pre-provider)
- `sourceLang`
- Active `providerId` and **`translateConfigEpoch`**

**Implied by filename (not in digest):** `targetLang`

**Exclude from digest:**

- `segmentRelativePath`, `logicalPath`
- Target locale file path on disk

**Invalidate L2 when:**

- `files.json` delta changes any tracked locale segment or source locale content (all segments under `locales.directory`)
- `translateConfigEpoch` changes
- Explicit bypass: `generate --force` (skip L2 reads), `--no-cache` (skip L1 + L2)

---

## Shared cache policy (no second config surface)

Translation cache **reuses** the existing project cache policy — no separate `translate.cache` block.

| Control | Applies to L2 | Applies to L1 |
|---------|---------------|---------------|
| `config.cache.enabled === false` | Bypass read/write | L1 still runs (in-process dedupe) |
| `config.cache.mode === readOnly` | Read hits; no writes | Unaffected |
| CLI/global `--no-cache` | Bypass | Bypass |
| Cache disable reasons (`project_root_missing`, …) | Graceful disable | N/A |

Hosts wire **`initializeCacheState`** / **`CacheRuntime`**; generate opens L2 per target and flushes in `finally`.

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
  targetLang: string;
  inputFilesEpoch: string;
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
| 0 | Locales phase: segment-aware `files.json` / `buildCurrentFileRecords` | **Done** (locales **H** + cache index) |
| 1 | `CacheState.translationsDir` + per-locale `translations/<code>.json` | **Done** |
| 2 | `translateConfigEpoch` helper + unit tests | **Done** |
| 3 | L1 per-run memo in generate translation pool | **Done** |
| 4 | L2 per-locale load/save + invalidation vs `files.json` epoch | **Done** |
| 5 | Wire lookup/write in generate cache wrapper (`translateLeafWithGenerateCache`) | **Done** |
| 6 | Respect `cache.enabled`, `cache.mode`, `--no-cache`; bypass L2 reads on `--force` | **Done** |
| 7 | Tests: hit/miss, stale epoch, L2 wrapper | **Done** (core unit tests) |
| 8 | User docs (`docs/cli/cache.md` translation section) | **Done** |
| 9 | Startup heal: drop malformed/oversize `translations/*.json` in `prepareCacheForRun` | **Done** |
| 10 | Port types in `types/translator/cache.ts` (no types→impl circular deps) | **Done** |

**Stability contract (shipped):**

- Lookup order fixed: **L1 → L2 → provider**; failures never cached.
- Epoch mismatch or corrupt locale file → treat as miss; **`healTranslationCacheFiles`** deletes bad files at cache prep (same pattern as `analysis.json` / `files.json`).
- `--no-cache` bypasses L1+L2; `cache.enabled: false` disables L2 only; `readOnly` skips L2 writes; `--force` skips L2 reads.

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
