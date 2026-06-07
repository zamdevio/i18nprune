---
description: Project workspace issue codes — config discovery, locales directory, src root, and layout validation.
---

# Project workspace (`i18nprune.project.*`)

These codes come from **`runProjectReadiness`** in **`@i18nprune/core`**: a small, shared **preflight** after the merged config and resolved **`paths.*`** are known. Checks include: an on-disk **`i18nprune.config.*`** (when required), **`paths.sourceLocale`**, **`paths.localesDir`**, and **`paths.srcRoot`**. The CLI runs this through **named presets** (aligned with commands such as **`validate`**, **`sync`**, **`locales delete`**, **`patch`**, **`init`**, …).

**Not the same as `doctor`:** **`doctor`** adds Node version, **`rg`**, its own config-file row, and path summaries (`i18nprune.doctor.*`). **`project.*`** is the shared readiness layer used before heavy work; **`project.config_file_missing`** is distinct from **`i18nprune.config.missing`** (the latter is for **explicit** config path load failures in core **`tryLoadCoreConfigFromPath`**, not “no default-discovered config in cwd”).

**Where paths come from:** With a config file, **`i18nprune.config.ts`** (or sibling) sets **`locales.source`** (source locale **language code**, e.g. `en`), **`locales.directory`** (locale bundle root), and **`src`**. Resolved **`paths.sourceLocale`** is the primary on-disk JSON file for that code. Without one, the engine still merges **built-in defaults** plus env / discovery / CLI — paths may look valid but not match your app. **`config --json`** includes **`configFileLoaded`** on the snapshot payload.

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

## `locales_source_not_language_code`

**Code:** `i18nprune.project.locales_source_not_language_code`  
**Severity:** `error`  
**When:** **`locales.source`** looks like a file path, an invalid tag shape, or a basename with no catalog match and no close suggestions.  
**What to do:** Set **`locales.source`** to a BCP47-style tag only (e.g. **`en`**, **`pt-br`**). Use **`locales.directory`**, **`mode`**, and **`structure`** to locate JSON on disk — see [Locale filesystem layouts](../config/locales.md#filesystem-layouts).

---

## `locales_source_not_in_bundle`

**Code:** `i18nprune.project.locales_source_not_in_bundle`  
**Severity:** `error`  
**When:** **`locales.source`** is a valid catalog code, but no locale JSON segments for that code exist under **`locales.directory`** (readiness lists codes found on disk).  
**What to do:** Fix the code, add the missing locale files, or align **`mode`** / **`structure`** with your tree.

Unknown or mistyped codes use **`i18nprune.languages.unsupported_language_code`** with the same **`— try: …`** hints as **`i18nprune generate`**. List every supported target code with **`i18nprune languages`** (alias **`langs`**); see [languages command](../commands/languages.md).

---

## `source_locale_missing_segments`

**Code:** `i18nprune.project.source_locale_missing_segments`  
**Severity:** `warning` (does not fail the command by itself)  
**When:** **`locales.mode`** is **`locale_directory`** with **`locale_per_dir`** or **`feature_bundle`**, and the configured source locale is missing a segment file that exists for another locale under **`locales.directory`**.  
**What to do:** Add the missing JSON under the source locale folder (e.g. `messages/en/auth.json` when `messages/fr/auth.json` exists), or fix **`locales.source`** if it points at the wrong code.

---

## `locales_structure_required`

**Code:** `i18nprune.project.locales_structure_required`  
**Severity:** `error`  
**When:** Config has **`locales.mode: "locale_directory"`** but **`locales.structure`** is omitted. Layout resolution does not guess **`locale_per_dir`** vs **`feature_bundle`**.  
**Who:** **`runProjectReadiness`** (`localesStructureRequired`).

**What to do:**

1. Set **`locales.structure`** to **`locale_per_dir`** (one folder per locale, e.g. `messages/en/common.json`) or **`feature_bundle`** (feature folders with `en.json` basenames, e.g. `messages/auth/en.json`).
2. Run **`i18nprune init`** on an existing tree if you want detection hints, or copy a layout example from [Locale filesystem layouts](../config/locales.md#filesystem-layouts).
3. Repo fixtures: **`tests/fixtures/layout-locale-per-dir`**, **`tests/fixtures/layout-feature-bundle`**.

**Commands:** Any preset that includes **`localesStructureRequired`** (e.g. **`generate`**, **`sync`**, **`locales list`**, **`validate`**, …).

---

## Hosted snapshot ingest

Codes covered in this section include `i18nprune.project.hosted_*`, `i18nprune.project.upload_*`, and `i18nprune.project.source_locale_*`.

Codes from **`validateHostedProjectIngestBody`** and **`fillProjectSnapshotExtraction`** / **`prepareProjectSnapshotFromArchive`** when building a prepared project snapshot for **`POST /v1/projects`** (primary JSON) or archive secondary mode.

### `hosted_snapshot_invalid`

**Code:** `i18nprune.project.hosted_snapshot_invalid`  
**Severity:** `error`  
**When:** Primary ingest body is not a valid prepared snapshot envelope (missing `snapshot`, bad `prepareMeta`, incomplete extraction fields, etc.).  
**Who:** `validateHostedProjectIngestBody` (`packages/core/src/project/validate/hostedSnapshot.ts`).  
**What to do:** Run host prepare (`prepareProjectSnapshotFromRoot` / CLI share upload) before upload; ensure `snapshot.extraction`, `sourceLocaleJson`, and `localeJsonByTag` are populated.

### `hosted_snapshot_schema_version`

**Code:** `i18nprune.project.hosted_snapshot_schema_version`  
**Severity:** `error`  
**When:** `schemaVersion` on the ingest body does not match **`HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION`** (currently `1`).  
**Who:** `validateHostedProjectIngestBody`.  
**What to do:** Align CLI/SDK/worker with the current schema version exported from `@i18nprune/core`.

### `upload_config_required`

**Code:** `i18nprune.project.upload_config_required`  
**Severity:** `error`  
**When:** Zip/archive prepare cannot normalize config (`locales.source`, `locales.directory`, `src`, `functions[]`).  
**Who:** `fillProjectSnapshotExtraction`, `prepareProjectSnapshotFromRoot`, `prepareShareHostedFromContext`.  
**What to do:** Include `i18nprune.config.json` (or a parseable `i18nprune.config.ts/js`) in the snapshot, or pass `configJson` on archive upload.

### `upload_config_json_invalid`

**Code:** `i18nprune.project.upload_config_json_invalid`  
**Severity:** `error`  
**When:** Optional `configJson` override is not a JSON object.  
**Who:** `fillProjectSnapshotExtraction`.  
**What to do:** Pass a single JSON object string for partial config overrides.

### `source_locale_not_found`

**Code:** `i18nprune.project.source_locale_not_found`  
**Severity:** `error`  
**When:** The configured source locale path is missing from the uploaded zip / collected snapshot paths.  
**Who:** `fillProjectSnapshotExtraction`.  
**What to do:** Ensure `locales.source` points at a file included in the share snapshot collection.

### `source_locale_invalid_json`

**Code:** `i18nprune.project.source_locale_invalid_json`  
**Severity:** `error`  
**When:** Source locale file bytes are not valid JSON.  
**Who:** `fillProjectSnapshotExtraction`.  
**What to do:** Fix the source locale file encoding and JSON syntax.

### `source_locale_invalid_shape`

**Code:** `i18nprune.project.source_locale_invalid_shape`  
**Severity:** `error`  
**When:** Source locale JSON root is not a plain object.  
**Who:** `fillProjectSnapshotExtraction`, `applyProjectAnalysisToSnapshot`.  
**What to do:** Use a top-level JSON object for the source catalog (`{ "key": "value" }`).

---

## Related

- [Doctor](./doctor.md) — full environment and path checks, including **`i18nprune.doctor.paths_*`**.
- [Validate](./validate.md) — **`i18nprune.validate.source_locale_unreadable`** when **`validate`** is the entrypoint.
- [Config](./config.md) — programmatic config load issues (**`i18nprune.config.*`**) vs path preflight (**`project.*`**).
- Command reference: **`i18nprune init`**, **`i18nprune doctor`**, **`i18nprune config`**.

For programmatic use, import **`runProjectReadiness`**, **`resolveProjectReadinessChecks`**, and **`ProjectReadinessRequest`** from **`@i18nprune/core`**; use **`mode: 'custom'`** with **`ProjectReadinessChecks`** if a host needs a different subset than the CLI presets.
