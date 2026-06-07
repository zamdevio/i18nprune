---
description: CLI disk cache under the tool home directory — profiles, rebuild modes, and separation from worker share storage.
---

# CLI cache

The CLI keeps **local disk state under one home directory** (`<home>`). That is separate from **hosted worker snapshots** (zip upload to the edge). Do not mix CLI cache files with worker project/report storage.

**`<home>`** defaults to `~/.i18nprune` (`%USERPROFILE%\.i18nprune` on Windows). Set **`I18NPRUNE_HOME`** to relocate the **entire** tree (project cache + version throttle). See [Paths on other operating systems](#paths-on-other-operating-systems).

## CLI home layout (three surfaces)

| Surface | Path under `<home>` | Read by SDK? | Purpose |
|---------|---------------------|--------------|---------|
| **Project cache** | `cache/` → `projects/<projectId>/` | **Yes** | `meta.json`, `files.json`, `analysis.json`, `translations/<code>.json` |
| **Version throttle** | `state/version.json` | **No** (CLI only) | npm `latest` check interval |
| **Per-project id** | `cache/projects/<16-char-hex>/` | (derived) | Stable folder from normalized **project root** hash |

Default tree (forward slashes shown for readability; Windows uses backslashes on disk):

```
<home>/                          # default ~/.i18nprune
├── cache/
│   ├── meta.json                # global project root → cache id index
│   └── projects/
│       └── <projectId>/
│           ├── files.json       # fingerprints: src/** + locale segments + localesLayout
│           ├── analysis.json    # scan payload for validate, report, generate, …
│           └── translations/    # per-target translation cache (generate L2)
│               └── <code>.json
└── state/
    └── version.json             # CLI update-check throttle only
```

Override only the project cache root with **`config.cache.dir`** (SDK policy; paths still built with `path.join` on the host). Version state **always** stays under `<home>/state/` when using the CLI home layout.

## Project cache layout

Under **`<home>/cache/`** (default `~/.i18nprune/cache/`):

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

Default roots use Node’s `os.homedir()` and `path.join` — you do not hand-write `\` or `/` in config for cache directories.

| Surface | Linux / macOS | Windows (CMD, PowerShell, Windows Terminal) |
|---------|---------------|---------------------------------------------|
| **CLI home (`<home>`)** | `~/.i18nprune/` | `%USERPROFILE%\.i18nprune\` |
| **Project cache** | `<home>/cache/` | `%USERPROFILE%\.i18nprune\cache\` |
| **Version throttle** | `<home>/state/version.json` | `%USERPROFILE%\.i18nprune\state\version.json` |

When **`I18NPRUNE_HOME`** is set, **both** `cache/` and `state/` live under that directory. The CLI prints an **`[info]`** line on each command with the resolved path.

### WSL vs Windows native Node

| Topic | WSL (Node inside distro) | Windows native Node |
|-------|--------------------------|---------------------|
| **Home** | `~/.i18nprune` under the Linux home (e.g. `/home/you/.i18nprune`) | `%USERPROFILE%\.i18nprune` |
| **`process.platform`** | `linux` | `win32` |
| **Same repo on `/mnt/c/...`** | Cache id hashes the **Linux-resolved** project root | Cache id hashes the **Windows** path — **different** `projects/<id>/` folders |
| **Sharing cache with native Windows** | **Not supported** — pick one Node environment per checkout | Same |

Run **`i18nprune doctor`** and **`validate`** with the same Node install you use for day-to-day work so cache and path warnings match your environment.

### Logical paths in JSON and logs

Locale lists, missing-key `file` lines, and similar **API output** use forward slashes (`/`) even on Windows. On-disk cache and locale files still use the host separator via `path.join`.

### Platform path warnings (readiness)

Before heavy work, **`runProjectReadiness`** may emit non-fatal path issues (reserved Windows segment names, very long paths, UNC roots). These do not block the run by default. See [Path & filesystem issues](../issues/paths.md).

| Limit | Issue code | Severity |
|-------|------------|----------|
| Reserved segment (`CON`, `NUL`, `COM1`, …) | `i18nprune.paths.windows_reserved_name` | `warning` |
| Path length ≥ ~240 chars on Windows | `i18nprune.paths.windows_long_path` | `warning` |
| UNC `\\server\share\...` | `i18nprune.paths.network_drive` | `info` |

On **macOS**, project cache ids **NFC-normalize** the project root before hashing so the same folder spelled NFD vs NFC on disk shares one cache id; i18nprune does not rename files on disk.

Override the project cache root with **`config.cache.dir`** when you need a custom location on any OS (version throttle remains under `<home>/state/` unless you change `<home>` via **`I18NPRUNE_HOME`**).

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

Update-check behavior is documented on this page and in CLI help output.

## Worker / web “snapshot”

Hosted project upload uses a separate **worker project snapshot** (zip + DO store). That is unrelated to CLI **`analysis.json`**.
