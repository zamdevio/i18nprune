# Patching — issue codes (`i18nprune.patching.*`)

[← Issue codes index](./README.md)

## Patching codes (overview)

**Severity:** `warning` or `error` depending on finding  
**When:** Read-only patching analysis detects schema, size, metadata, or config/file divergence issues.  
**Who:** **`doctor`** and **`validate`** command paths that call the core patching analyzer.  
**What to do:** Follow the exact issue message and align your i18n files with the patching contract in [patching loader schema](../patching/loader.md).

Common codes:

- `i18nprune.patching.config_too_large`
- `i18nprune.patching.config_size_anomaly`
- `i18nprune.patching.config_invalid_schema`
- `i18nprune.patching.config_parse_failed`
- `i18nprune.patching.catalog_mismatch_english_name`
- `i18nprune.patching.catalog_mismatch_native_name`
- `i18nprune.patching.catalog_mismatch_direction`
- `i18nprune.patching.config_locale_missing_file`
- `i18nprune.patching.file_locale_missing_config`
- `i18nprune.patching.config_section_incomplete`

The headings below exist so **`docHref`** anchors (e.g. `#config-parse-failed`) resolve on this page. See [patching overview](../patching/README.md) and [loader contract](../patching/loader.md).

---

## `config_section_incomplete` {#config-section-incomplete}

**Severity:** `warning`  
**When:** Your **`i18nprune`** config defines a **`patching`** object, but **`patching.enabled`** is **`false`** (or implied off) while **`configPath`** and/or **`loaderPath`** is empty — so **`--patch`**, **`generate --patch`**, and **`i18nprune patch`** cannot run loader-generated updates. The CLI suppresses **`--patch`** until these fields are set (see **`i18nprune patch --init`**).  
**Who:** **doctor** / **validate** (via **`analyzePatchingState`** with **`--patch`**), **`patch`** analyze path, and **`applyCommandPatching`** when **`--patch`** is passed.  
**What to do:** Add non-empty **`configPath`** (app **`config.json`**) and **`loaderPath`** (**`loaders.generated.ts`**) under **`patching`**, or remove the stub **`patching`** block until you adopt the recipe.

---

## `config_too_large`

**Severity:** `error` — config read exceeds **`sizeLimitBytes`**. Align file size or raise the limit in patching config.

---

## `config_size_anomaly`

**Severity:** `warning` — config size looks unusual vs locale count. Review the file called out in the diagnostic.

---

## `config_invalid_schema`

**Severity:** `error` — **`locales`** array missing or rows do not match the expected record shape.

---

## `config_parse_failed`

**Severity:** `error` — **`config.json`** at **`configPath`** is not valid JSON.

---

## `catalog_mismatch_english_name`

**Severity:** `warning` — **`englishName`** differs from the language catalog; run **`i18nprune patch --fix`** to reconcile when appropriate.

---

## `catalog_mismatch_native_name`

**Severity:** `warning` — **`nativeName`** catalog mismatch (same guidance as English name).

---

## `catalog_mismatch_direction`

**Severity:** `warning` — **`direction`** catalog mismatch.

---

## `config_locale_missing_file`

**Severity:** `warning` — locale row exists in config but JSON file is missing under the resolved locales directory.

---

## `file_locale_missing_config`

**Severity:** `warning` — locale JSON exists on disk but has no matching config row.
