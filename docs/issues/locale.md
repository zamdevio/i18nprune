# Locale — issue codes (`i18nprune.locale.*`)

[← Issue codes index](./README.md)

## `target_not_found`

**Code:** `i18nprune.locale.target_not_found`  
**Severity:** `error` or `warning` depending on command mutability.  
**When:** **`--target`** names a code with no matching **`locales/<code>.json`** (excluding the source locale where applicable).  
**Who:** **`locales edit`**, **`locales delete`**, **`generate --resume`** (missing **`locales/<code>.json`**), **`missing --target`**, and similar target resolution paths.  
**What to do:** List locales with **`i18nprune locales list`**, fix spelling, or **`generate`** the locale first. For **`missing --target`**, missing targets are skipped with a warning while other valid targets continue; suggestions are shown only when an existing locale or catalog-backed code match is clear.
