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

## `--debug-cache`

Prints cache diagnostics with the **`[i18nprune] [cache]`** channel (suppressed in **`--json`**, **`--quiet`**, **`--silent`**).

Includes dispatch status, paths (`meta`, `files`, `analysis`), and per-file fingerprint deltas on misses.

## Clearing data

Delete **`~/.i18nprune/cache`** or **`projects/<id>/`** to reset. There is no dedicated wipe subcommand today.

## Not the npm version throttle

Registry update checks use **`~/.config/i18nprune/updatestate.json`**, not **`~/.i18nprune/cache/`**.

## Worker / web “snapshot”

Hosted project upload uses a separate **worker project snapshot** (zip + DO store). That is unrelated to CLI **`analysis.json`**.
