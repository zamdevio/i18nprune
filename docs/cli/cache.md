# CLI cache

The CLI persists a **small on-disk cache** so repeat runs skip redundant work when project files are unchanged.

## Layout

Under your home directory (default):

```
~/.i18nprune/cache/
├── meta.json                 # global project root → cache id index
└── projects/
    └── <projectId>/
        ├── files.json        # fingerprints: src/** + locale segments + localesLayout
        └── analysis.json     # project scan: key sites, dynamic sites, missing keys, counts
```

`projectId` is derived from the **resolved project root**, so distinct checkouts produce distinct cache namespaces.

## `files.json`

Every cached command compares the live project tree to **`files.json`**:

| Block | Contents |
|-------|----------|
| **`files`** | Tracked `src/**` paths (hash, size) |
| **`localeSegments`** | Bundle-relative locale JSON allowed by the active layout |
| **`localesLayout`** | Fingerprint: `mode`, `structure`, `directory`, `source` |

Layout mismatch or file changes invalidate the scan cache on the next run (`files_changed` or `run_binding_stale`).

Partial rescan: when only the layout fingerprint changes, the cache re-walks locale segments and reuses the cached `src/**` index when possible.

## `analysis.json`

Single run payload for **all core ops** that need a project scan (`validate`, `report`, `quality`, `review`, `missing`, `sync`, `cleanup`, `locales dynamic`, …).

Envelope shape:

```json
{
  "version": 1,
  "projectId": "…",
  "inputFilesEpoch": "…",
  "data": {
    "version": 1,
    "keyObservations": [],
    "dynamicSites": [],
    "missingKeys": [],
    "counts": {
      "keyObservations": 0,
      "dynamicSites": 0,
      "sourceFilesScanned": 0,
      "missingKeys": 0
    }
  }
}
```

| Field | Purpose |
|-------|---------|
| **`keyObservations`** / **`dynamicSites`** | Full scan arrays for commands that need file:line detail |
| **`missingKeys`** | Literal keys in code missing from the source locale (computed at cache miss) |
| **`counts`** | Fast summaries without walking large arrays (doctor, generate, report summary) |

**Not stored in `analysis.json`:** machine or host metadata (`generatedAt`, `toolVersion`, `cwd`, OS/Node environment). Those are applied when a command builds an export (e.g. **`i18nprune report`** reads host facts at run time via `ReportHostHooks`).

After **`sync`** / **`generate`** write locale files, the CLI drops **`analysis.json`** so the next command rescans with the updated tree.

## When data is reused

A **hit** means: **`files.json`** matches the current tree **and** **`analysis.json`** parses **and** `inputFilesEpoch` matches the merged fingerprint digest.

Otherwise the command recomputes the scan and writes fresh JSON.

## `--no-cache`

Global **`--no-cache`** disables cache for that process.

## Cache profiles

Set a single preset, then override only what you need. The SDK resolves the final policy (CLI merges config + flags, then applies the profile).

```ts
cache: {
  profile: 'balanced', // safe | balanced | fast — default: balanced when omitted
  enabled: true,
  // Optional overrides (only when set; they replace the profile value for that field):
  // rebuild: 'full',
  // fullRescanThresholdPercent: 40,
  // mode: 'readOnly',
}
```

| Profile | `rebuild` | `fullRescanThresholdPercent` | `mode` | Typical use |
|---------|-----------|------------------------------|--------|-------------|
| **`safe`** | `full` | `10` | `readWrite` | Prefer correctness; always full analysis scan on miss (`10` applies only if you switch to `partial`). |
| **`balanced`** (default) | `partial` | `40` | `readWrite` | Default shipped behavior. |
| **`fast`** | `partial` | `70` | `readWrite` | Large repos; tolerate more partial work before a full src scan. |

**Override rule:** `profile` supplies defaults. Any **explicit** `rebuild`, `fullRescanThresholdPercent`, or `mode` in config wins over the profile. Omitted fields use the profile. `enabled` and `dir` are independent of the profile.

**CLI:** `--cache-profile <safe|balanced|fast>` sets `cache.profile` for that run (same override rules: explicit `rebuild`, `fullRescanThresholdPercent`, or `mode` in the config file still win over the profile).

`i18nprune init --rich` emits `profile: 'balanced'` with commented override lines.

## Incremental analysis rebuild

When **`files.json`** reports changes and a valid **`analysis.json`** exists, the SDK may **patch** scan arrays instead of walking all of `src/**` (when resolved `rebuild` is `partial`):

| Field | Effect |
|-------|--------|
| **`cache.rebuild`** | `partial`: patch from the file delta when safe. `full`: always run a full project scan on every analysis miss. |
| **`cache.fullRescanThresholdPercent`** | When `rebuild` is `partial`, if changed/added/deleted **src** files reach this percent of tracked src files, fall back to a full src scan. Applies to **src** only, not locale segments. |

Resolved values come from **`cache.profile`** unless you override those fields explicitly (see table above).

Partial rebuild today covers **src file** changes only (delete rows for removed paths, rescan changed/added files, recompute `missingKeys` from the unchanged source locale). Locale-only or layout changes still trigger a full scan until later cache phases add finer-grained locale patching.

If **`files.json`** is missing, invalid, or empty but **`analysis.json`** is still valid and the project fingerprint (`inputFilesEpoch`) matches, the SDK **rebuilds only the files index** and reuses analysis (fast path; `--debug-cache` shows `files_index_recovered`). If the project changed on disk since the last analysis write, a full scan runs with an explicit reason (`files.json missing`, `invalid`, or `project files changed`).

## `--debug-cache`

Prints cache diagnostics with the **`[i18nprune] [cache]`** channel (suppressed in **`--json`**, **`--quiet`**, **`--silent`**).

Includes dispatch status, paths (`meta`, `files`, `analysis`), per-file fingerprint deltas on misses, and **`analysis rebuild: partial (...)`** vs **`analysis rebuild: full (...)`** when analysis is recomputed.

## Clearing data

Delete **`~/.i18nprune/cache`** or **`projects/<id>/`** to reset. There is no dedicated wipe subcommand today.

## Not the npm version throttle

Registry update checks use **`~/.config/i18nprune/updatestate.json`**, not **`~/.i18nprune/cache/`**.

## Worker / web “snapshot”

Hosted project upload uses a separate **worker project snapshot** (zip + DO store). That is unrelated to CLI **`analysis.json`**.
