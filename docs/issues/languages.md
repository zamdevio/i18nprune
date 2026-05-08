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
**When:** A locale code is not in the translation-target catalog (e.g. typo in **`--target`** or config).  
**Who:** **`assertSupportedTargetLanguageCode`** (`@i18nprune/core`); CLI **`validateTargetLanguageCode`**.  
**What to do:** Run **`i18nprune languages`**, pick a supported code, or fix spelling.
