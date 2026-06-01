# Cache systems — maintainer map

**Audience:** Maintainers and agents touching any cache layer in core or CLI.  
**User-facing:** [`docs/cli/cache.md`](../../docs/cli/cache.md) (disk project cache + flags only).  
**Receipts:** [`shipped-slices.md`](../phases/shipped-slices.md) · **Multi-OS paths / home:** [`platform.md`](./platform.md).

---

## At a glance

Seven distinct cache layers. **Do not conflate roots or lifetimes.**

| # | Layer | Lifetime | Location | Owner | Used by |
|---|--------|----------|----------|-------|---------|
| **1** | **Locale read** | One `CoreContext` / command run | In-memory (`ctx.localeRead`) | Core | validate, sync, generate, missing, … |
| **2** | **Project index** | Persistent per project root | `~/.i18nprune/cache/projects/<id>/files.json` | Core policy, CLI default root | All ops that scan or fingerprint |
| **3** | **Analysis** | Persistent per project root | `…/analysis.json` | Core | validate, report, share prepare, … |
| **4** | **Translate L1** | One `generate` invocation | In-memory (`TranslateCacheL1Memo`) | Core | `generate` only |
| **5** | **Translate L2** | Persistent per project + target locale | `…/translations/<code>.json` | Core | `generate` only |
| **6** | **Share local** | Persistent per project | `…/share.json` (+ `share.bak/`) | Core | `share` upload/list/view/delete |
| **7** | **Version / update** | Persistent global (CLI) | `<home>/state/version.json` | **CLI only** | npm latest check throttle |

**Global bypass:** `--no-cache` disables project disk cache (and L1); L2 also skipped when project cache off. **`config.cache.enabled: false`** same effect.

---

## 1 — Locale read cache (in-memory)

**Purpose:** Avoid re-parsing the same locale JSON files multiple times within one command.

**Shape:** `CoreContext.localeRead` — `LocaleReadCache` with two maps:

| Map | Key | Value |
|-----|-----|-------|
| `segments` | Absolute file path | Parsed segment snapshot (document + leaves + text, or diagnostics) |
| `localeCodes` | Normalized locale code | Merged leaves for that code (multi-segment layouts) |

**Entry points:**

- `readLocaleSegmentFromContext` — one segment file
- `readLocaleCodeSurfaceFromContext` — merged surface for a locale code
- `createLocaleReadCache` — fresh store per context
- `invalidateLocaleReadCacheForAbsolutePath` — drop segment + affected locale-code entries after writes

**Rules:**

- Scoped to **one run** — never written to disk.
- Writers (sync, generate locale patches) must invalidate touched absolute paths so later reads in the same run see fresh data.
- Independent of `files.json` / `analysis.json` — locale reads for missing-key logic can hit this even when project cache is cold.

**Code:** `packages/core/src/shared/locales/read/fromContext.ts`, `read/cache.ts` · types: `types/locales/readCache.ts`

---

## 2 & 3 — Project disk cache (`files.json` + `analysis.json`)

**Root:** `~/.i18nprune/cache/` (CLI `defaultCliCacheRootDir()`; overridable via `config.cache.dir`).

```txt
~/.i18nprune/cache/
├── meta.json
└── projects/<projectId>/
    ├── files.json       # fingerprints + localeSegments + localesLayout
    ├── analysis.json    # keyObservations, dynamicSites, missingKeys, counts
    ├── translations/    # L2 — see §5
    └── share.json       # share local — see §6
```

**`projectId`:** hash of normalized project root — lowercased forward-slash path (`cache/io/hash.ts`). Case-insensitive volumes (typical Windows) collapse casing; Linux may differ.

### Two-layer model

```txt
files.json     → WHAT changed (fingerprints + delta)
analysis.json  → EXPENSIVE derived state (code scan + missingKeys)
```

| Layer | Partial rebuild | Full rewrite |
|-------|-----------------|--------------|
| **`files.json`** | Layout-only → rescan locale segments, reuse src index | Empty / invalid index |
| **`analysis.json`** | Src patch, target-only reuse, source-only missingKeys patch | Threshold exceeded, mixed locale+src, `rebuild: 'full'` |

### Ownership (locked)

| Layer | Owns |
|-------|------|
| **Core** | Paths, I/O, `getOrBuildCachedProjectData`, `decideAnalysisRebuild`, patch/reuse, invalidate primitives, `cache.*` schema |
| **CLI** | Host: `Context` → `CacheState` + `CacheRuntime`, `--no-cache`, `--debug-cache`, `--cache-profile` |

**Hosts must not fork delta/patch logic.**

### Config (`cache` block)

Resolved by `resolveCacheConfig` (`cache/resolveConfig.ts`).

| Profile | `rebuild` | `fullRescanThresholdPercent` |
|---------|-----------|------------------------------|
| **`safe`** | `full` | `10` |
| **`balanced`** (default) | `partial` | `40` |
| **`fast`** | `partial` | `70` |

Explicit `rebuild`, `fullRescanThresholdPercent`, or `mode` **override** profile defaults.  
`rebuild: 'full'` → always full scan; `--debug-cache` must say `full (config rebuild=full)`.

### Delta classification

Paths in `CacheFileDelta` split by `files.json` block keys:

- **Src key** → incremental scan patch (or full if over threshold)
- **Source locale segment** → recompute `missingKeys` only
- **Target locale only** → reuse scan arrays (no code rescan)
- **Layout fingerprint change** → partial files rescan + full analysis

Observations use **srcRoot-relative** paths (`extractor/shared/projectScan.ts`).

### Invalidate policy

- Target-only sync/generate **does not** delete `analysis.json` — next dispatch reuses or patches.
- Unconditional delete only for explicit clear or `rebuild: 'full'`.
- `invalidateProjectAnalysisCacheAfterLocaleWrites` skips delete for target-only writes.

**Code:** `packages/core/src/cache/` · CLI host: `packages/cli/src/shared/cache/`

---

## 4 & 5 — Translate cache (L1 + L2)

**Scope:** `generate` only — reuses provider results; does **not** replace locale JSON files or `--resume` semantics.

### Lookup order

```txt
L1 (in-memory) → L2 (disk per target) → provider API
```

Progress reports `cacheHits` with layer (`l1` | `l2`).

### L1 — in-memory memo

| Property | Detail |
|----------|--------|
| Class | `TranslateCacheL1Memo` |
| Lifetime | One `generate` run (shared across targets in that invocation) |
| Key | Hash of source text + langs + provider + `translateConfigEpoch` |
| Bypass | `--no-cache` (`cli_no_cache`) → L1 undefined |

**Code:** `translator/cache/l1Memo.ts`, `resolveL1.ts`, `invokeWithL1.ts`

### L2 — disk per target locale

| Property | Detail |
|----------|--------|
| Path | `projects/<id>/translations/<targetLang>.json` |
| Schema | `TranslationLocaleCacheFile` — rows keyed by cache key, stores provider result metadata |
| Epoch | `inputFilesEpoch` from `files.json` — stale rows ignored after project fingerprint change |
| Bypass | Project cache off; `generate --force` can set `bypassL2` |
| Heal | Startup drops malformed/oversize files (`maintenance.ts`) |

**Open/flush:** `openTranslateCacheL2ForTarget`, `flushTranslateCacheL2` per target during generate.

**Code:** `translator/cache/l2Store.ts`, `l2Io.ts`, `paths.ts`, `resolveCache.ts`, `cacheKey.ts`

---

## 6 — Share local cache (`share.json`)

**Purpose:** Remember worker upload ids + config/epoch hashes so CLI/web can skip re-upload or purge stale rows after worker 404.

**Location:** `{projectCacheDir}/share.json` beside `files.json`.  
**Backups:** `{projectCacheDir}/share.bak/share.json.bak.<stamp>.json` on heal of corrupt manual edits.

**Behavior:**

- Self-heal on load (Zod + migration); issues `share.json_repaired` when repaired.
- Skip upload when tracked-files epoch + hashes match and worker row still exists.
- Purge local row on confirmed worker not-found (404).
- Respects `cache.mode: readOnly` and `--no-cache` (no local writes).

**Not on worker edge** — worker stores prepared snapshots only; no `.i18nprune/cache` on upload.

**Code:** `packages/core/src/share/cache/` · constants: `shared/constants/share.ts` · **Systems:** [`share.md`](./share.md)

---

## 7 — Version cache (CLI-only)

**Purpose:** Throttle npm registry “latest version” checks — **not** project analysis.

**Path:** `<home>/state/version.json` (`I18NPRUNE_HOME` or `~/.i18nprune`)  
**Owner:** `packages/cli/src/utils/update/` — **core never reads this file**.

Skipped when `CI`, `--json`, or `I18NPRUNE_NO_UPDATE_CHECK`.

---

## Host flags (quick reference)

| Flag / config | Effect |
|---------------|--------|
| `--no-cache` | Disable project disk cache; skip L1; no share.json writes |
| `--debug-cache` | Extra stderr lines for rebuild + invalidation decisions |
| `--cache-profile safe\|balanced\|fast` | One-run profile merge |
| `cache.enabled: false` | Same as no cache |
| `cache.mode: readOnly` | Read hits allowed; no disk writes (incl. share.json, L2 flush) |
| `cache.rebuild: full` | Opt out of partial analysis rebuild |
| `generate --force` | Can bypass L2 (`bypassL2`) |

---

## Code map (all layers)

| Concern | Path |
|---------|------|
| Locale read cache | `shared/locales/read/fromContext.ts`, `read/cache.ts` |
| Project dispatch | `cache/dispatch.ts`, `engine.ts`, `trackedFiles.ts` |
| Analysis produce | `analysis/project.ts` |
| Translate L1/L2 | `translator/cache/` |
| Share local | `share/cache/io/shareJson.ts`, `share/ops/` |
| CLI version cache | `packages/cli/src/utils/update/` |
| CLI project host | `packages/cli/src/shared/cache/` |
| Types | `types/cache/`, `types/locales/readCache.ts`, `types/translator/cache.ts`, `types/share/entry.ts` |
| Tests | `cache/__tests__/`, `translator/cache/__tests__/`, `shared/locales/read/__tests__/cache.test.ts`, parity `tests/parity/` |

---

## Decisions (locked)

1. **Core owns** project rebuild policy; CLI/IDE do not fork it.
2. **Locale read cache** is per-run only — invalidate on same-run writes.
3. **Translate L1/L2** never substitute for writing locale JSON; `--resume` is separate.
4. **Share.json** is a host convenience cache — worker is source of truth for hosted ids.
5. **Version cache** stays CLI-only unless product explicitly moves it.
6. **User-facing** disk cache docs: `docs/cli/cache.md` only (no maintainer links in VitePress).

**Deferred:** worker/web segment index alignment with hosted snapshot `localeSegments` keys.

---

## Cross-links

- **Share worker + routes:** [`share.md`](./share.md)
- **Platform / multi-OS:** [`platform.md`](./platform.md) (adapters, `I18NPRUNE_HOME`, translate L2 paths)
- **User docs:** [`docs/cli/cache.md`](../../docs/cli/cache.md)
