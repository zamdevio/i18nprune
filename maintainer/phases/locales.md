# Locales phase — multi-topology storage (**shipped — Session H**)

**Status:** **Shipped (core + CLI)** — tracker rows **0–10** done. **Do not delete this file** — it remains the design reference (leaf identity, reader/writer contract, layout modes). **Active work** moved to **[`cache.md`](./cache.md)** (incremental `analysis.json` rebuild).  
**Dependency:** **Init** ([`init.md`](./init.md)) — **shipped**.  
**Upstream:** **Extractor** ([`extractor.md`](./extractor.md)) — unchanged ownership.

Canonical phase order: **[`active-phase.md` § Locked chain](./active-phase.md#locked-cross-phase-dependency-chain)**.

---

## Implementation tracker

| # | Task | Status |
|---|------|--------|
| 0 | Config: nested `locales: { source, directory, mode?, structure? }` | **Done** |
| 0 | Types under `types/locales/`; leaves under `shared/locales/leaves/{walk,segmentSource,mode}/` | **Done** |
| 0 | Flat helpers: `readFlatLocaleJsonSurface`, `writeFlatLocaleJsonDocument` | **Done** |
| 0 | Web + worker upload: nested config only (no legacy flat `source` / `localesDir`) | **Done** |
| 1a | `resolveLocalesLayout` + `isLocalesLayoutReadSupported` / `isLocalesLayoutWriteSupported` (`shared/locales/layout/`) | **Done** |
| 1b | `readLocaleBundle` / `writeLocaleBundle` façade (flat `locale_file` only) | **Done** |
| 1c | Ops on façade: `validate`, `missing` (read path) | **Done** |
| 1d | `readLocaleJsonFromContextSync` / `writeLocaleJsonFromContextSync`; all locale JSON ops on façade | **Done** |
| 1e | Layout types in `types/locales/layout.ts` (not under `shared/`) | **Done** |
| 2 | `listLocaleCodes` / segment path resolution | **Done** |
| 3 | `structure`: `locale_per_dir` reader + fixtures | **Done** |
| 4 | `structure`: `feature_bundle` + structural parity diagnostics | **Done** |
| 5 | `mode`: `locale_directory` layout | **Done** |
| 6 | Init preset / discovery emit `mode` / `structure` when confident | **Done** |
| 7 | Migrate ops: list → sync → generate/missing write → quality/review → cleanup → locales edit/delete | **Done** |
| 8 | Web/worker extraction use same enumeration as CLI | **Done** |
| 9 | User docs: one example per topology | **Done** |
| 10 | Segment-aware `files.json` for project cache (all locale segments, not only `sourceLocale`) | **Done** — see [Row 10 plan](#row-10-filesjson-plan) (shipped in cache/locales slice; details in [`cache.md`](./cache.md)) |
| — | Layout fixtures under `tests/fixtures/layout-*` + `tests/integration/layout.fixtures.test.ts` | **Done** |
| — | Post-H: Knip with `ignoreExportsUsedInFile: false` (see `locales.md` § Knip follow-up) | **Todo** (hygiene; not blocking cache) |
| — | **Project cache incremental analysis** | **Moved** → **[`cache.md`](./cache.md)** (active) |
| — | **Translate cache** ([`translate-cache.md`](./translate-cache.md)) | **Deferred** — **after** [`cache.md`](./cache.md) incremental rebuild |

**PR slice discipline:** one row (or tight pair like 1a+1b) per PR; parity tests after each op migration.

**Next core vertical:** **[`cache.md`](./cache.md)** — partial vs full `analysis.json` rebuild, `cache.rebuild` policy. **Then** **[`translate-cache.md`](./translate-cache.md)** (H.1).

---

## Locked design (agreed — implement during H)

### Leaf provenance (shipped naming)

**Leaf API (in-memory):** segment file provenance **`fileOrigin?: LocaleSegmentSource`**; structured JSON metadata string on disk → **`source?: string`** (same field name as on-disk JSON).

```ts
fileOrigin?: {
  file: string;           // absolute segment JSON path
  locale: string;
  relativePath: string;   // bundle-root–relative, POSIX `/`
};
```

Structured JSON metadata field `"source": "manual"` on disk → leaf API field **`source?: string`** (`manual`, provider id, `sync`, …).

### Leaf identity (no cross-file merge)

| Concept | Rule |
|---------|------|
| Canonical identity | `(segmentRelativePath, logicalPath)` |
| Same logical path in **different** segment files | **Two leaves** (e.g. `en/auth.json` vs `en/feature/auth.json`) |
| List / dashboard UI | Deterministic **`leafId`** — 8 hex chars from digest of segment + logical path |
| List payload shape | Sorted **array** of rows; each row includes `leafId`, `logicalPath`, `segmentRelativePath`, `value`, `source` |

No cross-file dedup or “collision errors” for duplicate logical paths across segments.

### Config-driven read (all locales)

- Only ingest paths valid for configured **`locales.mode`** + **`structure`**.
- **`flat_file`:** implicit `locale_file` — only `locales.directory/*.json` at bundle root (no `structure` required).
- Extra langs, wrong topology, depth &gt; **16** → **`locale_read_path_layout_mismatch`**: warn, skip, continue (source, `--target` locales, missing, etc.).
- Constant: **`MAX_LOCALE_SEGMENT_TREE_DEPTH = 16`** (walker + docs).

### Landing (Session D.2)

Architecture-adjacent section in `apps/landing` (no `PRIMARY_NAV` entry): modes, structures, nested dirs, depth limit, warn-skip behavior.

---

## Goal

Support **multiple locale filesystem topologies** while preserving the **same core operations** (`validate`, `sync`, `generate`, `missing`, `review`, `cleanup`, `quality`, `report`, …) and their **semantic contracts** (logical keys, issues, parity behavior).

This is a **locale storage evolution**, not a rewrite of business rules.

---

## Core principle

```txt
reader / writer abstraction only
```

**Normalized locale surface** is the contract between **storage** and **operations**.

- **Downstream ops** consume **topology-agnostic** normalized data (today’s logical paths + values + structured leaf metadata).  
- **Forbidden pattern:** scattering `if (mode === 'flat_file')` / `if (mode === 'locale_directory')` across every op.

---

## Config evolution (principles, not frozen types)

Move from implicit “`sourceLocale` path + flat `localesDir` siblings” toward an explicit **`locales`** configuration object that owns:

| Owns | Does **not** own |
|------|-------------------|
| **Storage topology** (how files are discovered and grouped) | Extractor `functions` / call-site algorithms |
| **Read / write behavior** (merge, split, provenance) | Translation provider logic |
| **Path roots and patterns** | CLI argv parsing |

**Illustrative** shape (field names **not** locked):

```ts
locales: {
  mode: 'flat_file' | 'locale_directory',
  // roots, globs, segment rules — TBD at implementation
  structure: 'locale_file' | 'locale_per_dir' | 'feature_bundle',
}
```

Exact Zod schema and `CoreResolvedPaths` evolution are **implementation artifacts** — this doc locks **separation of concerns** and **behavioral intent**.

---

## Supported storage modes (**v1 scope — tight**)

### `flat_file` (**current behavior**)

Example:

```txt
locales/
├── en.json
├── fr.json
```

Single JSON file per locale code at the **locales root** (plus existing `*.meta.json` sidecar rules).

---

### `locale_directory`

Example:

```txt
messages/
├── en/
│   ├── auth.json
│   └── dashboard.json
├── fr/
│   ├── auth.json
│   └── dashboard.json
```

All JSON string files for a locale live under a **per-locale directory tree**.

---

## Supported structures (**filesystem**, not JSON nesting)

JSON nesting inside a file is **already** handled by `collectTranslationSurfaceLeaves` and friends — this phase addresses **how many files** participate in one locale.

| Structure | Typical use with | Meaning (informal) |
|-----------|------------------|---------------------|
| **`locale_file`** | `flat_file` | One file is the entire locale document (`en.json`). |
| **`locale_per_dir`** | `locale_directory` | Locale code is a **directory** (`messages/en/.../*.json`). |
| **`feature_bundle`** | `locale_directory` | Feature-first tree (`locales/auth/en.json` — locale segment varies by layout rules). |

**Stop here for v1** of this document — avoid speculative additional topologies until these three are **shipped and stable**.

---

## Reader responsibility

The **locale reader** (core module boundary — exact name TBD) **owns**:

- File **discovery** and ordering  
- **Merge** into a **normalized locale surface** (logical key paths **identical** to what ops expect today)  
- **Reverse provenance**: which **segment file** contributed each logical key (for writes, diagnostics, extension UX)

**All downstream operations** receive normalized data + provenance metadata — they **do not** parse locale layout.

---

## Writer responsibility

The **locale writer** owns:

- Mapping normalized edits back to **physical files**  
- **Topology-aware** grouping (e.g. `groupBy(segmentFile)` when persisting)  
- Creating/moving segment files when the operation requires it — per op policy + **missing** placement rules (below)

Core **operations** stay **topology-agnostic** — they emit **logical** patches; the writer applies **physical** plans.

---

## Enriched locale leaves

The reader **attaches** segment file provenance on every normalized row as **`fileOrigin`** (see [Locked design](#locked-design-agreed--implement-during-h)). Structured locale JSON keeps its on-disk `"source"` string on the leaf as **`source`**.

**Purpose:** enable `key → segment file` for **sync**, **generate**, **missing**, and **extension** hovers/navigation; writer uses **`fileOrigin`**, not ad-hoc rediscovery.

---

## Missing key placement (**agreed**)

**No** new config keys such as `placement: { … }` in v1 of this plan.

Instead:

- **Owner:** the **`missing`** operation (core) owns a **smart suggestion** engine: candidate segment files, ranked with **confidence**.  
- **High confidence:** auto-place (operation may write without extra host steps — subject to existing dry-run / explicit-write flags).  
- **Ambiguous:** return **multiple candidates + scores**; **host** chooses UX (CLI prompt, extension picker).  
- **Core** = recommendation logic; **hosts** = interaction only.

---

## Non-goals (locales phase)

- Plugin marketplace for arbitrary locale providers.  
- Premature **remote** locale backends as part of this slice.  
- Exploded config surface (every knob per framework).  
- Mode-specific branching **inside** each op — use **reader/writer** boundary.  
- Breaking **logical** key semantics or stable **`issues[]`** codes without the normal parity / migration process.

---

## Risks

- **Generate** write-back is the **hardest** op — split normalized edits back to segment files using each leaf’s **`source`**.  
- **Disk cache** fingerprinting must include **all** segment files in a locale bundle — not only a single `sourceLocale` path (tracker row **10**; prerequisite for [`translate-cache.md`](./translate-cache.md) L2).  
- Cross-segment duplicate **logical** paths are **allowed** (separate leaves); do not treat as merge collisions.

---

## Extension relationship

The extension **reads** normalized + provenance payloads from core APIs. It **must not** maintain a second locale filesystem model that diverges from the reader.

Extension phase doc: [`extension/README.md`](./extension/README.md).

---

## Implementation sequencing (locked order)

See **Implementation tracker** above. High-level phases:

1. **Façade** — layout resolver + `readLocaleBundle` / `writeLocaleBundle` (flat only); migrate ops incrementally.  
2. **Enumeration** — list locale codes and segment files per layout.  
3. **`structure`** — multi-file per locale (`locale_per_dir`, then `feature_bundle`).  
4. **`mode`** — `locale_directory` bundle root semantics.  
5. **Ops migration** — generate write-back last among mutating ops.  
6. **Hosts + docs** — web/worker + VitePress examples per topology.

---

## Future-safe notes

- New topologies = **new enum values + reader/writer pair**, not new `switch` arms in `runQuality`.  
- Preserve **byte-stable** `--json` contracts per repo parity rules when extending payloads (additive fields preferred).

---

## Row 10 — `files.json` plan

**Problem (resolved — row 10 shipped):** Previously `dispatch` fingerprinted only `src/**` plus one synthetic source entry. **Now:** `localeSegments` + `localesLayout` in `files.json`; merged diff invalidates `analysis.json` on segment edits. Incremental analysis patch → [`cache.md`](./cache.md).

**Schema version:** stay at **`version: 1`** (`CACHE_SCHEMA_VERSION` is already `1`; pre-v1 — no migration story for old on-disk caches required). Extend the v1 shape in place; missing `localeSegments` on load → treat as `{}` (legacy CLI caches keep working until next miss).

**One layout per `files.json` (LOCKED)**

Each on-disk index is bound to **exactly one** resolved layout. **Layout** = `mode` + `structure` + bundle root + source path (anything that changes how `listLocaleSegments` walks or keys files).

- **Reader gate (first):** `cached.localesLayout` equals current layout fingerprint → per-block diff. **Layout mismatch → locale block rescan only** (replace `localeSegments` + `localesLayout`; **reuse** cached `files` / no `src/**` walk). Do not diff old locale keys against a new layout.
- **One schema on disk** for all layouts; different layouts → different segment keys from the same enumerator, not different JSON top-level shapes.
- **Partial rescan (LOCKED)** — avoid “always walk everything” when one dimension changed (see matrix below). **Full rescan** = both blocks rebuilt (fallback: corrupt `files.json`, first run, or safety path).

**Layout-exclusive segment index (LOCKED)**

`localeSegments` keys come **only** from `listLocaleSegments({ layout })` — the same path the read/write/archive stack uses. No parallel scanner, no “index everything under `<locales.directory>`”.

| Rule | Behavior |
|------|----------|
| **One layout → one key shape** | `locale_file` → root `*.json` only (`en.json`, `fr.json`). `locale_per_dir` → `en/*.json` only (`en/common.json`). `feature_bundle` → `auth/en.json` style. **Never** mix shapes in one `files.json` (e.g. `en.json` + `en/common.json` together means the layout gate failed or the writer is wrong). |
| **Disallowed JSON on disk** | Walk may see extra `*.json`; `localeCodeForSegment` returns `null` → **omit from index** (same as I/O ignores them). Do not fingerprint “orphan” files — saves space and matches runtime. |
| **Non-JSON under bundle root** | **Never** read or hash (`.md`, `.txt`, etc.). Scanner: `walkLocaleJsonSegments` — `*.json` only (includes legacy `*.meta.json` if present; product no longer writes them, but they are JSON and layout rules apply). `recursive` from `structure`. Cache uses `listLocaleSegments` only. |
| **Examples in docs/tests** | Show **one structure per fixture** — not a combined example that looks like multiple layouts coexist. |

**Proposed on-disk shape** — two blocks only (`src` vs locale bundle). Example **`locale_per_dir`** only:

```json
{
  "version": 1,
  "updatedAt": "2026-05-17T12:00:00.000Z",
  "localesLayout": {
    "mode": "locale_directory",
    "structure": "locale_per_dir",
    "directory": "messages",
    "source": "messages/en/common.json"
  },
  "files": {
    "src/main.ts": { "hash": "…", "size": 200, "mtimeMs": 0, "updatedAt": "…" }
  },
  "localeSegments": {
    "en/common.json": { "hash": "…", "size": 1234, "mtimeMs": 0, "updatedAt": "…", "locale": "en" },
    "fr/common.json": { "hash": "…", "size": 90, "mtimeMs": 0, "updatedAt": "…", "locale": "fr" }
  }
}
```

(`locale_file` would instead have keys like `en.json` / `fr.json` only — never `en/common.json` in the same file.)

**Why `files` + `localeSegments` (not three blocks, not `__source_locale__`)**

| Block | Contents | Why separate |
|-------|----------|--------------|
| **`files`** | `src/**` only | `listSourceFiles` + exclude rules; unrelated to locale tree. |
| **`localeSegments`** | Segments **allowed by current `localesLayout`** via `listLocaleSegments` (source included when it is a valid segment for that structure) | Reuses existing layout rules; no duplicate filtering. Keys = bundle-relative `relativePath` from enumerator. No synthetic `__source_locale__` (legacy load: map once, drop on next save). |
| **`localesLayout`** | Layout fingerprint | Gate before diff; wrong layout → full miss, not a polluted index. |

**Not** a third block for “source vs other locales” — source is just another segment; splitting would duplicate layout rules and force special-case diff logic for no size win (segment count is small vs `src/**`).

**Partial invalidation matrix (LOCKED)**

What runs on disk vs what happens to snapshot/analysis:

| Trigger | `files` (`src/**`) | `localeSegments` | `localesLayout` | Run slot (`snapshot` / `analysis`) |
|---------|-------------------|------------------|-----------------|----------------------------------|
| Layout fingerprint mismatch (mode, structure, directory, source) | **Reuse** cached map | **Rescan** (`listLocaleSegments` only), replace block | Update | **Miss** if merged epoch changes (producer runs); no src walk |
| Locale segment add/change/delete (layout matches) | **Reuse** | **Rescan** that block (diff drives miss) | Reuse | Miss when locale diff non-empty |
| `src/**` or exclude change | **Rescan** | **Reuse** | Reuse | Miss when src diff non-empty |
| Both src and locale changes | Both rescan | Both rescan | Reuse | Miss |
| `files.json` malformed / oversize | **Fallback:** rebuild both blocks | Same | Rewrite | Miss (`cache_malformed` warn) |
| Manual `files.json` edit (valid JSON) | Next run: diff vs disk truth | Same | Same | Added/changed/deleted keys reconcile on rescan of affected block only |
| `inputFilesEpoch` stale vs merged map (sibling writer) | — | — | — | `run_binding_stale` (existing) |

**Reader / writer flow**

1. Load `files.json` → validate v1 (malformed → empty baseline → full rebuild both blocks).
2. Compare `localesLayout` fingerprint.
3. **Selective scan:** layout mismatch → scan locales only, keep `files`; else scan locales only when needed for diff; scan `src/**` only when needed for diff (implementation: build `current*` maps per matrix, not always both).
4. `diff` per block (layout mismatch: skip locale diff vs stale keys — replace locale block wholesale).
5. `mergeTrackedFileMaps` → `computeInputFilesEpoch` (unchanged contract).
6. Persist: update only blocks that were rescanned; always refresh `updatedAt` / epoch binding on producer miss.

**Manual / hostile `files.json`:** trust on-disk file content when rescanning a block; index records are hints for diff, not authority. Tampered hashes → corrected on next block rescan. Missing `localeSegments` keys → `added` on scan. Extra keys → `deleted`.

**Core API sketch (row 10 slice only)**

- `resolveCachedLocalesLayout(config, localesDir)` → fingerprint for gate
- `layoutMatches(a, b)` → boolean
- `buildTrackedProjectFileRecords(input)` → `{ files, localeSegments, localesLayout }` — `localeSegments` from `listLocaleSegments` only (layout-filtered, JSON-only walk)
- `mergeTrackedFileMaps(...)` → flat map for epoch
- `validateProjectFilesPayload` — require `files` + `localesLayout` when `localeSegments` present; default missing `localeSegments` → `{}` for legacy caches

**Functions / modules (row 10)**

| Area | Change |
|------|--------|
| `packages/core/src/cache/dispatch.ts` | Build both maps; diff merged baseline vs merged current. |
| `packages/core/src/types/cache/index.ts` | `CacheProjectFilesState` adds `localeSegments?`, `localesLayout?`. `CachedProjectInput` gets `localesDir` + `locales` config. |
| `packages/core/src/cache/setup/policy.ts` | Validate extended v1; default missing `localeSegments` to `{}`. |
| `packages/core/src/cache/engine.ts` | `mergeTrackedFileMaps` + use in diff/epoch. |
| `packages/cli/src/shared/cache/dispatch.ts` | Pass locale paths + `ctx.config.locales`. |
| `packages/core/src/analysis/project.ts` | Same. |
| `packages/core/src/cache/__tests__/runtime.test.ts` | Layout fixtures: segment edit → `files_changed`. |

**Acceptance:** Edit a non-source locale segment under any `tests/fixtures/layout-*` → next cached `report` / `validate` → `files_changed` miss.

---

### After row 10 (same pattern — **not** in row 10 PR)

**Incremental `analysis.json` rebuild (partial vs full, locale-aware):** canonical plan → **[`cache.md`](./cache.md)** (core owns logic; CLI/IDE are hosts).

| Surface | Today | Target |
|---------|--------|--------|
| **CLI disk cache** | `.cache/.../files.json` + `analysis.json` with `inputFilesEpoch` | Row 10 ships segment-aware `files.json`; analysis incremental rebuild → [`cache.md`](./cache.md). |
| **Worker DO `snapshot`** | `ProjectStoreRow.snapshot` with `localeJsonByTag` built at upload; **no** `files.json` | **Follow-up:** either store `inputFilesEpoch` on snapshot + re-use core segment scan on read, or embed a slim `localeSegmentIndex` in snapshot that mirrors `localeSegments` keys/hashes. Decide after row 10 lands — **do not** change worker upload in row 10. |
| **Web local zip** | Same as worker — `buildLocaleJsonByTagFromArchive` only | **Follow-up:** shared core helper that produces the same logical index as `files.json` `localeSegments` for in-memory sessions (zip has no `.cache` dir today). |
| **Translate cache** (`translations.json`) | Separate slot (H.1) | After locales + row 10; may **read** `inputFilesEpoch` from `files.json` for invalidation. |
| **`src/i18n/config.json` (patching)** | Not in file index | Optional later; only if patching freshness bugs appear. |

**Decision for row 10:** touch **CLI `.cache` `files.json` only**. Worker/web snapshot stays stable in row 10; plan the convergence PR immediately after so hosted + local use the **same** segment enumeration + hash keys as disk cache.

---

## Knip follow-up (post-H)

After locales tracker rows **8–9** (and ideally **10**), flip **`knip.json`** → **`ignoreExportsUsedInFile: false`** and burn down findings in passes:

1. **Barrel trims** — remove dead re-exports from `packages/core/src/index.ts` and namespace barrels; import from defining modules at call sites.
2. **CLI** — delete remaining pass-through modules (e.g. removed `constants/issueCodes.ts` / `constants/links.ts`); keep `constants/env.ts` only where CLI adds keys not in core.
3. **Apps** — extension webview entry graph vs `project` globs; landing shiki allowlist vs real imports.
4. **CI gate** — `pnpm knip` in CI once clean; keep `tests/fixtures/**` ignored.

Until then, leave **`ignoreExportsUsedInFile: true`** to avoid noise mid-H.
