# Versioning and npm update discovery

This document describes how the CLI learns whether a newer **`i18nprune`** package exists on the **public npm registry**, without a separate API. Behavior is **registry-only**, **best-effort**, and **never fatal** if the network fails.

---

## What it does

- Compares the **running CLI semver** (from the published package / `packages/cli/src/constants/cli.ts`) to the **`latest`** dist-tag on npm.
- **Throttles** automatic checks to **once per 24 hours** per machine using **`<home>/state/version.json`** (see [Cache](#cache-directory-24h-throttle)).
- Shows a **`[notice]`** line under the command banner when the cache says a **newer** `latest` exists (live registry check when possible; otherwise notes that npm could not be verified).
- **`i18nprune version --check`** always hits the registry (unless opted out) and refreshes the on-disk cache.
- **`i18nprune version --reset`** clears that cache so the next automatic check is not blocked by the throttle timer (path and fields: [Cache](#cache-directory-24h-throttle)).

---

## Where the code lives

| Area | Location |
|------|----------|
| **Constants** (registry URL, schema version, 24h interval) | `packages/cli/src/constants/update.ts` |
| **Env opt-out** (`I18NPRUNE_NO_UPDATE_CHECK`, `CI`, `I18NPRUNE_ENV_KEYS`) | `packages/cli/src/constants/env.ts` |
| **Home + version path** | `packages/cli/src/shared/home/resolve.ts` |
| **Read/write `version.json`** | `packages/cli/src/utils/update/cache.ts` |
| **Fetch npm + semver compare** | `packages/cli/src/utils/update/registry.ts` |
| **Background refresh** | `packages/cli/src/utils/update/index.ts` (`ensureUpdateCacheRefreshed`) |
| **Post-banner update notice** | `packages/cli/src/utils/update/notice.ts` (`maybePrintUpdateNoticeAfterBanner`) |
| **Install hints (npm / pnpm)** | `packages/cli/src/utils/update/installHint.ts` |
| **`version --check` / `--reset`** | `packages/cli/src/utils/update/version.ts`, `packages/cli/bin/cli.ts` |
| **Banner wiring** | `packages/cli/src/utils/cli/banner.ts` |

---

## How it flows

1. **`preAction`** (after run options are set): **`ensureUpdateCacheRefreshed({ jsonOutput })`** runs unless global **`--json`**, **`CI`**, or **`I18NPRUNE_NO_UPDATE_CHECK`** is set.
2. If **`now − lastAttemptMs` < 24h**, return (no fetch).
3. Otherwise fetch **`latest`** from npm; update **`version.json`** (always bump **`lastAttemptMs`**; on success refresh **`latestRegistryVersion`** and related fields).
4. The **banner** only **reads** the cache; it does not fetch synchronously.

`version --check` **bypasses** the 24h throttle (still respects **`I18NPRUNE_NO_UPDATE_CHECK`**).

---

## Registry-only

- **Endpoint:** `GET https://registry.npmjs.org/i18nprune/latest` (canonical URL in `packages/cli/src/constants/update.ts` as **`NPM_REGISTRY_LATEST_URL`**).
- **Parsed field:** `version` (semver string).
- **Failures:** Offline, timeout, non-OK HTTP, or bad JSON → no thrown errors; the CLI may keep showing the **last successful** cached value.

---

## Cache directory (24h throttle)

This is **not** the [**CLI project cache**](../cli/cache.md) under **`<home>/cache/`**. That folder stores fingerprinted report inputs; **`<home>/state/version.json`** only records npm **`latest`** check timing.

| Platform | Path |
|----------|------|
| **Default** | `~/.i18nprune/state/version.json` (`%USERPROFILE%\.i18nprune\state\version.json` on Windows) |
| **Custom home** | `$I18NPRUNE_HOME/state/version.json` when **`I18NPRUNE_HOME`** is set |

The file includes:

- **`schemaVersion`** — matches **`UPDATE_STATE_SCHEMA_VERSION`** in `packages/cli/src/constants/update.ts`.
- **`lastAttemptMs`** — last registry fetch **attempt** (success or failure). Another **automatic** attempt waits **24 hours** unless you run **`version --check`**.
- **`lastSuccessMs`**, **`latestRegistryVersion`**, **`lastError`**, **`registryEndpoint`**, **`cliVersionWhenRecorded`** — see field names in `packages/cli/src/utils/update/cache.ts` (`UpdateStateFile`).

If a fetch **fails**, **`lastAttemptMs`** still advances (cooldown), and previous success fields are **retained** when present.

**Missing directory or file:** If **`version.json`** or its parent folder does not exist yet, **read** behaves as **empty state** (same shape as a fresh install: **`lastAttemptMs`:** `0`, nulls for unknown fields — nothing is written to disk). The **first write** (background refresh when due, **`version --check`**, etc.) creates **`<home>/state/`** if needed, then writes **`version.json`**.

---

## Opt-out and CI

| Condition | Behavior |
|-----------|----------|
| **`I18NPRUNE_NO_UPDATE_CHECK=1`** (or `true` / `yes`) | No registry calls, no banner hint; **`version --check`** only reports that checks are disabled (and still prints the current semver). |
| **`CI=true`** | Same as opt-out for automation. |

Documented with other env vars in [Environment variables](../config/env.md).

---

## Constants layout (update vs report)

- **Update discovery** knobs that are not environment variable **names** live in **`packages/cli/src/constants/update.ts`** (registry URL, on-disk schema version, throttle duration). That keeps **`packages/cli/src/constants/env.ts`** focused on **env var identifiers** and re-exports used by **`config --json`**.
- **Project report** JSON (`i18nprune.projectReport`, inline HTML placeholder, report schema version) stay defined in **`packages/report`** (workspace **`@i18nprune/report-schema`**; published as **`i18nprune/report`**) and are re-exported from **`packages/cli/src/constants/env.ts`** for consumers that already import report DTOs from one place. Moving those into the CLI tree would duplicate sources or create awkward package→CLI dependencies; revisit only if you want a single **`packages/cli/src/constants/report.ts`** that **both** the CLI and the report package import (would require a shared small package or careful re-exports).

---

## Commands

- **`i18nprune version`** — prints the running semver.
- **`i18nprune version --check`** — **always** attempts a registry fetch (unless opted out), prints current / latest / SDK lines, **`[notice]`** when newer, and one install line with **`pnpm … or npm …`**. Persists result in **`version.json`** (see [Cache directory (24h throttle)](#cache-directory-24h-throttle)).
- **`i18nprune version --reset`** — clears that cache; combine with **`--check`** to clear then query npm immediately.
- **`-v` / `--version`** on the root program are rewritten to **`version`** when you did not pass another command, so **`-q` / `-s`** and the banner behave the same as **`i18nprune version`** (see [CLI verbosity](../cli/verbosity/README.md)).

---

## See also

- [Environment variables](../config/env.md)
- [Doctor command](../commands/doctor/README.md) (diagnostics; update hints are global, not doctor-only)
