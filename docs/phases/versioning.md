# Phase — Version & update discovery (registry + cache)

**Status:** **Shipped** — registry-only, XDG config cache, banner hint, **`version --check`**, **`version --reset`**, **`updatestate.json`**, constants in **`packages/cli/src/constants/update.ts`**.

This file is **development-only** (see repo `.gitignore` for `docs/phases/`).

**Public user docs:** [`docs/versioning/README.md`](../versioning/README.md).

--- 

## Goal

Notify users when a **newer `@zamdevio/i18nprune`** exists on npm, **without** a custom API. Use the **npm registry** as the single source of truth, respect **privacy / CI**, and **never fail** the CLI when the network or response is bad.

---

## Design decisions (locked)

| Topic | Choice |
|--------|--------|
| **Registry** | `GET https://registry.npmjs.org/@zamdevio/i18nprune/latest` → JSON `version` (URL: **`NPM_REGISTRY_LATEST_URL`** in `packages/cli/src/constants/update.ts`). |
| **Custom API** | **Not used** in v1. |
| **Config directory** | **XDG-style**: `$XDG_CONFIG_HOME/i18nprune` or `~/.config/i18nprune/` (Node `os.homedir()`). **Not** a bare `~/.i18nprune` dotfolder — keeps alignment with common CLI tooling and leaves room for more files later. |
| **Cache file** | **`updatestate.json`** — `schemaVersion`, `lastAttemptMs`, `lastSuccessMs`, `latestRegistryVersion`, `lastError`, `registryEndpoint`, `cliVersionWhenRecorded`. |
| **Reset** | **`i18nprune version --reset`** deletes **`updatestate.json`**. |
| **Throttle** | At most **one registry attempt per 24h** per machine (unless **`version --check`**, which always attempts when not opt-out). |
| **Opt-out** | **`I18NPRUNE_NO_UPDATE_CHECK`** — also listed in **`I18NPRUNE_ENV_KEYS`** for **`config --json`**. |
| **CI** | **`CI=true`** skips registry usage (same as opt-out for automation). |
| **JSON output** | Global **`--json`** skips **background** refresh (no machine noise / no network). |
| **Banner** | **Wrangler-style** dim lines under the boxed header when cache says a newer **latest** exists (uses **cache only** for text; refresh runs in **`preAction`** when due). |
| **`doctor`** | No separate post-flight update line (avoids duplicating the banner). |

---

## Flow (background refresh)

1. **`preAction`** (after `setRunOptions`): **`await ensureUpdateCacheRefreshed({ jsonOutput })`**.
2. If **`jsonOutput`**, **`CI`**, or **`I18NPRUNE_NO_UPDATE_CHECK`** → return.
3. If **`now - lastAttemptMs` < 24h** → return.
4. **Fetch** registry; on **any** outcome, bump **`lastAttemptMs`**.
5. On **success**, set **`latestRegistryVersion`**; on failure, **keep** previous **`latestRegistryVersion`**.

---

## Flow (`version --check`)

1. Unless opt-out: **always** fetch (bypass 24h throttle).
2. Update cache on success.
3. Print current, latest, and **manual** `npm i -g @zamdevio/i18nprune` when newer.

---

## Implementation map

| Piece | Location |
|--------|-----------|
| Constants (URL, schema, interval) | `packages/cli/src/constants/update.ts` |
| Paths | `packages/cli/src/utils/update/paths.ts` |
| Cache + 24h | `packages/cli/src/utils/update/cache.ts` |
| Fetch + semver | `packages/cli/src/utils/update/registry.ts` |
| `ensureUpdateCacheRefreshed`, banner line | `packages/cli/src/utils/update/index.ts` |
| **`version --check`**, **`version --reset`** | `packages/cli/src/utils/update/version.ts`, `packages/cli/bin/cli.ts` |
| Banner lines | `packages/cli/src/utils/cli/banner.ts` |
| Env | `packages/cli/src/constants/env.ts` (`ENV_I18NPRUNE_NO_UPDATE_CHECK`, **`I18NPRUNE_ENV_KEYS`**) |

---

## Follow-ups (optional)

- [ ] Richer **pre-release** / **dist-tag** selection (not just `latest`).
- [ ] Optional **`i18nprune outdated`** alias.

---

## See also

- [`docs/versioning/README.md`](../versioning/README.md)
- [`docs/config/env.md`](../config/env.md)
- [`docs/phases/README.md`](./README.md)
