# CLI cache

The CLI uses **two local on-disk areas** (plus an optional override). Do not confuse them with hosted worker project snapshots (zip upload).

| Surface | Default location | Purpose |
|---------|------------------|---------|
| **Project + analysis + translate cache** | `<home>/cache/` (default `~/.i18nprune/cache/`) | Fingerprints, scan payload, per-locale translation cache |
| **Version throttle** | `<home>/state/version.json` | npm `latest` check interval — **CLI only**, not read by the SDK scan cache |

**`<home>`** defaults to `~/.i18nprune`. Override the whole tree with **`I18NPRUNE_HOME`** (see [Paths on other operating systems](#paths-on-other-operating-systems)).

## Project cache layout

Under your home directory (default):

```
~/.i18nprune/cache/
├── meta.json                 # global project root → cache id index
└── projects/
    └── <projectId>/
        ├── files.json        # fingerprints: src/** + locale segments + localesLayout
        ├── analysis.json     # project scan: key sites, dynamic sites, missing keys, counts
        └── translations/     # per-target translation cache (generate only)
            └── <code>.json   # L2 hits for one target locale
```

`projectId` is derived from the **resolved project root** (normalized to lowercase forward-slash form), so distinct checkouts produce distinct cache namespaces. On case-insensitive volumes (typical Windows), paths that differ only by letter casing share one cache id; on case-sensitive Linux trees they may not.

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

## Translation cache (`generate`)

`i18nprune generate` can reuse prior **successful** provider results so repeat runs skip duplicate API calls.

Per-target files live beside `files.json` and `analysis.json` under `projects/<projectId>/translations/<code>.json`. The SDK builds those paths with the host `path.join` adapter (backslashes on native Windows, forward slashes in WSL/Linux) — there are no hardcoded `/` segments in cache IO.

| Layer | Scope | When |
|-------|-------|------|
| **L1** | In-process memo for one generate run | Always (unless `--no-cache`) |
| **L2** | `translations/<target>.json` on disk | When project cache is enabled (`config.cache.enabled` is not `false`; same gate as `files.json` / `analysis.json`) |

Lookup order: **L1 → L2 → provider**. Progress lines include **`cacheHits=N`** (L1 + L2 hits for that target).

| Control | Effect |
|---------|--------|
| **`--no-cache`** | Bypass L1 and L2 |
| **`config.cache.enabled: false`** | Disable L2 only; L1 still runs |
| **`cache.mode: readOnly`** | Read L2; no writes |
| **`generate --force`** | Skip L2 reads (still writes new successes unless read-only) |

Each locale file stores masked source text identity, provider id, translate config epoch, and `inputFilesEpoch` from **`files.json`**. When source files or translate settings change, stale rows are ignored. Corrupt or oversize `translations/*.json` files are removed during cache prep (same heal pattern as `analysis.json`).

Translated strings live under **`~/.i18nprune/cache/`** — treat that directory like any secret-bearing local data if you use cloud providers.

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

| Change | Behavior |
|--------|----------|
| **Target locale only** (e.g. `fr.json`) | Reuse cached scan arrays; refresh **`files.json`** fingerprints only (`--debug-cache`: `analysis rebuild: skipped (target locale only)`). |
| **Source locale only** | Re-read source locale segment(s) and recompute **`missingKeys`**; no `src/**` walk. |
| **Src files only** | Patch `keyObservations` / `dynamicSites` for the delta; recompute **`missingKeys`**. |
| **Layout fingerprint** | Full project scan (safe default). |

Under **`locale_directory`**, source locale reads merge every source segment; **`missingKeys`** compare code keys to logical paths present in any source segment file.

If **`files.json`** is missing, invalid, or empty but **`analysis.json`** is still valid and the project fingerprint (`inputFilesEpoch`) matches, the SDK **rebuilds only the files index** and reuses analysis (fast path; `--debug-cache` shows `files_index_recovered`). If the project changed on disk since the last analysis write, a full scan runs with an explicit reason (`files.json missing`, `invalid`, or `project files changed`).

## `--debug-cache`

Prints cache diagnostics with the **`[i18nprune] [cache]`** channel (suppressed in **`--json`**, **`--quiet`**, **`--silent`**).

Includes dispatch status, paths (`meta`, `files`, `analysis`), per-file fingerprint deltas on misses, and **`analysis rebuild: partial (...)`** vs **`analysis rebuild: full (...)`** when analysis is recomputed.

## Clearing data

Delete **`~/.i18nprune/cache`** or **`projects/<id>/`** to reset. There is no dedicated wipe subcommand today.

## Paths on other operating systems

Default roots use Node’s `os.homedir()` and `path.join` — no manual path strings in your project config.

| Surface | Linux / macOS | Windows (CMD, PowerShell, Windows Terminal) |
|---------|---------------|---------------------------------------------|
| **CLI home (`<home>`)** | `~/.i18nprune/` | `%USERPROFILE%\.i18nprune\` |
| **Project cache** | `<home>/cache/` | same under profile |
| **Version throttle** | `<home>/state/version.json` | same under profile |

Set **`I18NPRUNE_HOME`** to relocate **both** cache and version state (the CLI prints an **`[info]`** line on each command when this variable is set).

**WSL:** paths follow the Linux column **inside the distro**. Do not expect a project cache written from Windows native Node to match WSL paths for the same repo on disk.

Override the project cache root with **`config.cache.dir`** when you need a custom location on any OS.

## Version throttle (`state/version.json`)

Registry update checks (optional banner after commands) write **`<home>/state/version.json`** — never under **`<home>/cache/`**.

**Home resolution:**

1. **`I18NPRUNE_HOME`** when set and non-empty (absolute path recommended).
2. Otherwise **`~/.i18nprune`** (`%USERPROFILE%\.i18nprune` on Windows).

The CLI creates **`<home>/state/`** on first write (`mkdir` with `recursive: true`).

**Skipped (no registry fetch, no file write from the check):**

- **`CI`** set to a truthy value (`1`, `true`, `yes`) — including GitHub Actions.
- **`I18NPRUNE_NO_UPDATE_CHECK`** set to a truthy value.
- **`--json`** machine output mode.

See also **`docs/versioning/README.md`** for update-check behavior.

## Worker / web “snapshot”

Hosted project upload uses a separate **worker project snapshot** (zip + DO store). That is unrelated to CLI **`analysis.json`**.
