# Locale — issue codes (`i18nprune.locale.*`)

[← Issue codes index](./README.md)

## `target_not_found`

**Code:** `i18nprune.locale.target_not_found`  
**Severity:** `error`  
**When:** **`--target`** names a code with no matching **`locales/<code>.json`** (excluding the source locale where applicable).  
**Who:** **`locales edit`**, **`locales delete`**, **`fill`** (missing **`locales/<code>.json`**), and similar target resolution paths.  
**What to do:** List locales with **`i18nprune locales list`**, fix spelling, or **`generate`** the locale first.
