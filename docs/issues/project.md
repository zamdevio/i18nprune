# Project workspace (`i18nprune.project.*`)

These codes come from **`runProjectReadiness`** in **`@i18nprune/core`**: a small, shared **preflight** after the merged config and resolved **`paths.*`** are known. Checks include: an on-disk **`i18nprune.config.*`** (when required), **`paths.sourceLocale`**, **`paths.localesDir`**, and **`paths.srcRoot`**. The CLI runs this through **named presets** (aligned with commands such as **`validate`**, **`sync`**, **`locales delete`**, **`patch`**, **`init`**, …).

**Not the same as `doctor`:** **`doctor`** adds Node version, **`rg`**, its own config-file row, and path summaries (`i18nprune.doctor.*`). **`project.*`** is the shared readiness layer used before heavy work; **`project.config_file_missing`** is distinct from **`i18nprune.config.missing`** (the latter is for **explicit** config path load failures in core **`tryLoadCoreConfigFromPath`**, not “no default-discovered config in cwd”).

**Where paths come from:** With a config file, **`i18nprune.config.ts`** (or sibling) sets **`locales.source`** (source locale JSON path), **`locales.directory`** (locale bundle root), and **`src`**. Without one, the engine still merges **built-in defaults** plus env / discovery / CLI — paths may look valid but not match your app. **`config --json`** includes **`configFileLoaded`** on the snapshot payload.

---

## `config_file_missing`

**Code:** `i18nprune.project.config_file_missing`  
**Severity:** `error`  
**When:** Readiness **`configFilePresent`** is enabled and **`CoreContext.configFileLoaded`** is **`false`** (CLI: no discovered **`i18nprune.config.*`** in cwd and no valid **`--config`** target).  
**Who:** **`runProjectReadiness`**; CLI sets **`configFileLoaded`** from **`configExists()`** in **`resolveContext`**.

**What to do:**

1. Run **`i18nprune init`** in the project root to create **`i18nprune.config.ts`** (or another supported extension). **`--yes`** writes the default filename without prompts; **`--rich`** seeds a larger starter template with more namespaces and safe defaults.
2. If a config already exists, **`init`** prints that it skipped creating a file and still runs post-init workspace guidance.
3. Prefer **one config per app/repo** so **`locales.source`**, **`locales.directory`**, and **`src`** stay consistent with how i18nprune scans and writes locale JSON.

**Related:** **`i18nprune.config.missing`** — load errors when a **specific** config path is requested; see [config](./config.md).

---

**Code:** `i18nprune.project.source_locale_unavailable`  
**Severity:** `error` (envelope / readiness gate)  
**When:** The resolved **`paths.sourceLocale`** file is missing, not a regular file, unreadable, or (when the check requires it) the JSON root is not a plain object (`{}`), e.g. array or `null`.  
**Who:** **`runProjectReadiness`** via **`sourceLocaleJsonReadable`** / **`sourceLocaleJsonObject`** checks; CLI **`cliReadinessIssues`** before commands that need a real source catalog.

**What to do:**

1. Confirm **`paths.sourceLocale`** in **`i18nprune config`** (or **`config --json`**) points to the file you intend (often **`locales/<source>.json`** where **`<source>`** matches config **`source`**, e.g. **`en`** → **`locales/en.json`**).
2. Create the file if missing: a UTF-8 JSON **object** at the top level (`{ "key": "value" }`), not a bare array or string.
3. Run **`i18nprune validate`** after the file exists: **`validate`** uses **`i18nprune.validate.source_locale_unreadable`** for the same class of source problems (stable code for that command only); other commands use **`project.source_locale_unavailable`**.
4. Run **`i18nprune doctor`** for a wider check (Node, **`rg`**, config, paths).

**Commands that gate on this (non-exhaustive):** **`quality`**, **`sync`**, **`missing`**, **`review`**, **`report`**, **`cleanup`**, **`generate`**, **`locales dynamic`**, **`locales delete`**, **`patch`**, **`init`** (post-config guidance), **`doctor`**, and **`config --json`** when paths are broken.

---

## `locales_dir_unavailable`

**Code:** `i18nprune.project.locales_dir_unavailable`  
**Severity:** `error`  
**When:** **`paths.localesDir`** is missing, not a directory, or the runtime cannot list it.  
**Who:** **`runProjectReadiness`** (`localesDirectoryAccessible`).

**What to do:**

1. Create the directory shown in **`i18nprune config`** (commonly **`locales/`** at the project root, or a path relative to your config).
2. Ensure config **`localesDir`** (or env **`I18NPRUNE_LOCALES_DIR`**) matches where your `*.json` locale files live.
3. **`i18nprune locales list`** lists files under **`localesDir`** once it exists; **`patch --init`** also expects this directory to exist so scaffolded **`config.json`** can list locale codes.

**Commands:** Same family as above; **`locales list`** only checks this directory (not source **`src`**).

---

## `src_root_unavailable`

**Code:** `i18nprune.project.src_root_unavailable`  
**Severity:** `error`  
**When:** **`paths.srcRoot`** is missing or not a directory.  
**Who:** **`runProjectReadiness`** (`srcRootDirectory`).

**What to do:**

1. Point config **`src`** at your application source root (the tree **`i18nprune`** scans for translation keys).
2. Create that directory if you are scaffolding a new app layout.
3. **`patch --init`** writes under **`<src>/i18n/`**; without a valid **`srcRoot`**, scaffold paths are wrong.

**Commands:** Any preset that includes **`srcRootDirectory`** (most pipeline commands, **`locales delete`**, **`patch`**, **`init`**, **`config --json`**, …).

---

## `locales_structure_required`

**Code:** `i18nprune.project.locales_structure_required`  
**Severity:** `error`  
**When:** Config has **`locales.mode: "locale_directory"`** but **`locales.structure`** is omitted. Layout resolution does not guess **`locale_per_dir`** vs **`feature_bundle`**.  
**Who:** **`runProjectReadiness`** (`localesStructureRequired`).

**What to do:**

1. Set **`locales.structure`** to **`locale_per_dir`** (one folder per locale, e.g. `messages/en/common.json`) or **`feature_bundle`** (feature folders with `en.json` basenames, e.g. `messages/auth/en.json`).
2. Run **`i18nprune init`** on an existing tree if you want detection hints, or copy a layout example from [Locale filesystem layouts](../locales/layouts.md).
3. Repo fixtures: **`tests/fixtures/layout-locale-per-dir`**, **`tests/fixtures/layout-feature-bundle`**.

**Commands:** Any preset that includes **`localesStructureRequired`** (e.g. **`generate`**, **`sync`**, **`locales list`**, **`validate`**, …).

---

## Related

- [Doctor](./doctor.md) — full environment and path checks, including **`i18nprune.doctor.paths_*`**.
- [Validate](./validate.md) — **`i18nprune.validate.source_locale_unreadable`** when **`validate`** is the entrypoint.
- [Config](./config.md) — programmatic config load issues (**`i18nprune.config.*`**) vs path preflight (**`project.*`**).
- Command reference: **`i18nprune init`**, **`i18nprune doctor`**, **`i18nprune config`**.

For programmatic use, import **`runProjectReadiness`**, **`resolveProjectReadinessChecks`**, and **`ProjectReadinessRequest`** from **`@i18nprune/core`**; use **`mode: 'custom'`** with **`ProjectReadinessChecks`** if a host needs a different subset than the CLI presets.
