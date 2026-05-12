# CLI cache

The CLI persists a **small on-disk cache** so repeat runs skip redundant work when your project files are unchanged.

## Layout

Under your home directory (default):

```
~/.i18nprune/cache/
├── meta.json
└── projects/
    └── <projectId>/
        ├── files.json    # fingerprints of scanned inputs
        └── run.json      # last successful heavy payload (report document)
```

`projectId` is derived from the **resolved project root**, so distinct checkouts produce distinct cache namespaces.

Full resolution logic: `packages/cli/src/shared/cache/paths.ts` (**`initializeCliCacheState`** / **`resolveCliCacheState`**).

## What is cached

Primarily **project report regeneration**: when **`i18nprune report`** builds a **`ProjectReportDocument`**, cache entries track content hashes for the resolved **scan root files** plus the **source locale** file (`files.json`). If nothing changed, **`run.json`** can satisfy the command without redoing extraction.

Other commands may bypass or ignore cache; if you widen scope safely, assume **report** benefits first.

## When data is reused

A **hit** means: prior **`files.json`** matches current fingerprints **and** **`run.json`** still parses validly (`getOrBuildProjectReportWithCache` in `packages/cli/src/shared/cache/dispatch.ts`). Otherwise the CLI recomputes, then writes refreshed JSON.

Warnings can disable caching for that run (**`CliCacheWarning`**) — e.g. project root unavailable or cache folder not writable.

## `--no-cache`

Global **`--no-cache`** (see root **`preAction`** in **`packages/cli/bin/cli.ts`**) sets **`noCache: true`**, disables this cache branch for that process, and **forces** fresh report production when report runs.

Typical uses:

- **Benchmarking** apples-to-apples without cache masking wall time ([Performance hub](../performance/README.md#cli-project-cache)).
- **Debugging** nondeterministic report issues.

## `--debug-cache`

Global **`--debug-cache`** prints cache diagnostics with the **`[i18nprune] [cache]`** logger family. Like **`--debug-scan`**, it is CLI-only debug output and is suppressed in **`--json`**, **`--quiet`**, and **`--silent`** modes.

Within a single CLI command, the first project-report lookup performs disk cache validation and then stores the loaded report in memory on the resolved command context. Later helpers in that same run reuse the in-memory document and print a compact **`project report cache memory hit (same_run)`** line instead of repeating file paths and deltas.

The debug output includes:

- dispatch status (**`hit`**, **`miss`**, **`bypass`**, **`disabled`**) and reason,
- resolved cache file paths,
- per-file fingerprint deltas for misses (**added**, **changed**, **deleted**, **unchanged** counts, with changed file samples),
- cache read/write warnings such as malformed JSON or oversized cache files.

Malformed cache JSON is treated as disposable cache state: the CLI warns in debug output, invalidates the broken project cache file where applicable, recomputes the report, and writes a fresh cache payload. A malformed global **`meta.json`** falls back to a fresh index and is overwritten on the next save.

## Clearing data

Deleting **`~/.i18nprune/cache`** (or **`projects/<id>`** inside it) resets cached fingerprints and stored reports. There is **no dedicated subcommand** only for CLI cache wipe today — remove the directory safely when the CLI is not running.

## Not the npm version throttle

Automatic **`latest`** semver checks (**`ensureUpdateCacheRefreshed`**) use **`~/.config/i18nprune/updatestate.json`** (XDG-aware), not **`~/.i18nprune/cache/`**. See **[Versioning and npm update discovery](../versioning/README.md#cache-directory-24h-throttle)** — that file gates **registry fetch throttle**, not project scan payloads.
