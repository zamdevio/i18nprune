# Locales phase — multi-topology storage (**in progress**)

**Status:** **In progress** — config + shared I/O façade (Phase 1) landed; directory / multi-file topologies not yet.  
**Dependency:** **Init** ([`init.md`](./init.md)) — **shipped** (`locales.source`, `locales.directory`, optional `mode` / `structure`).  
**Upstream:** **Extractor** ([`extractor.md`](./extractor.md)) — unchanged ownership.

Canonical phase order: **[`active-phase.md` § Locked chain](./active-phase.md#locked-cross-phase-dependency-chain)**.

---

## Implementation tracker

| # | Task | Status |
|---|------|--------|
| 0 | Config: nested `locales: { source, directory, mode?, structure? }` | **Done** |
| 0 | Types under `types/locales/`; leaves under `shared/locales/leaves/{walk,fileOrigin,mode}/` | **Done** |
| 0 | Flat helpers: `readFlatLocaleJsonSurface`, `writeFlatLocaleJsonDocument` | **Done** |
| 0 | Web + worker upload: nested config only (no legacy flat `source` / `localesDir`) | **Done** |
| 1a | `resolveLocalesLayout` + `isLocalesLayoutSupported` (`shared/locales/layout/`) | **Done** |
| 1b | `readLocaleBundle` / `writeLocaleBundle` façade (flat `locale_file` only) | **Done** |
| 1c | Ops on façade: `validate`, `missing` (read path) | **Done** |
| 1d | `readLocaleJsonFromContextSync` / `writeLocaleJsonFromContextSync`; all locale JSON ops on façade | **Done** |
| 1e | Layout types in `types/locales/layout.ts` (not under `shared/`) | **Done** |
| 2 | `listLocaleCodes` / segment path resolution | **Done** |
| 3 | `structure`: `locale_per_dir` reader + fixtures | **Todo** |
| 4 | `structure`: `feature_bundle` + structural parity diagnostics | **Todo** |
| 5 | `mode`: `locale_directory` layout | **Todo** |
| 6 | Init preset / discovery emit `mode` / `structure` when confident | **Todo** |
| 7 | Migrate ops: list → sync → generate/missing write → quality/review → cleanup → locales edit/delete | **Todo** |
| 8 | Web/worker extraction use same enumeration as CLI | **Todo** |
| 9 | User docs: one example per topology | **Todo** |
| 10 | Segment-aware `files.json` for project cache (all locale segments, not only `sourceLocale`) | **Todo** |
| — | **Translate cache** ([`translate-cache.md`](./translate-cache.md)) — **after H** | **Deferred** |

**PR slice discipline:** one row (or tight pair like 1a+1b) per PR; parity tests after each op migration.

**Next phase after H:** **[`translate-cache.md`](./translate-cache.md)** — in-memory + per-project `translations.json` beside `snapshot.json`; same `config.cache` / `--no-cache` policy. **Not started until locales tracker 3–7 + row 10 are Done** (or row 10 explicitly shipped early for cache dispatch).

---

## Locked design (agreed — implement during H)

### Leaf provenance (`source` on disk)

**Planned rename (Phase 3+):** `fileOrigin` → **`source`** (`LocaleSegmentSource`); structured JSON `"source"` → **`catalogSource`** on the leaf API.

```ts
source?: {
  file: string;           // absolute segment JSON path
  locale: string;
  relativePath: string;   // bundle-root–relative, POSIX `/`
};
```

Structured JSON metadata field `"source": "manual"` on disk → leaf API field **`catalogSource?: string`** (avoids clashing with disk `source` object).

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

The reader **attaches** disk provenance on every normalized row as **`source`** (see [Locked design](#locked-design-agreed--implement-during-h)). Structured locale JSON keeps its on-disk `"source"` string; the leaf API exposes that as **`catalogSource`**.

**Purpose:** enable `key → segment file` for **sync**, **generate**, **missing**, and **extension** hovers/navigation; writer uses **`source`**, not ad-hoc rediscovery.

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
