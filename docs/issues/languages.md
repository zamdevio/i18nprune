# Languages — issue codes (`i18nprune.languages.*`)

[← Issue codes index](./README.md)

## `empty_filter`

**Code:** `i18nprune.languages.empty_filter`  
**Severity:** `info`  
**When:** **`languages --filter`** matched **no** catalog rows.  
**Who:** **`languages`**, **`runLanguages`**.  
**What to do:** Widen or fix the filter substring.

---

## `unsupported_language_code`

**Code:** `i18nprune.languages.unsupported_language_code`  
**Severity:** `error`  
**When:** A locale code is not in the translation-target catalog (typo in **`generate --target`**, **`locales.source`**, or **`I18NPRUNE_SOURCE`**).  
**Who:** **`assertSupportedTargetLanguageCode`** (`@i18nprune/core`); CLI **`validateTargetLanguageCode`**; config **`validateLocalesSourceConfigValue`**.  
**What to do:** Run **`i18nprune languages`** (alias **`langs`**) to list supported codes — see [languages command](../commands/languages.md). Fix spelling or pick a catalog code from the **`— try: …`** hint.
