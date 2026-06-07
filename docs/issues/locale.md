---
description: Locale file issue codes — missing targets, placeholder leaves, and source/target leaf mismatches.
---

# Locale — issue codes (`i18nprune.locale.*`)

[← Issue codes index](./README.md)

## `target_not_found`

**Code:** `i18nprune.locale.target_not_found`  
**Severity:** `error` or `warning` depending on command mutability.  
**When:** **`--target`** names a code with no matching **`locales/<code>.json`** (excluding the source locale where applicable).  
**Who:** **`locales edit`**, **`locales delete`**, **`generate --resume`** (missing **`locales/<code>.json`**), **`missing --target`**, and similar target resolution paths.  
**What to do:** List locales with **`i18nprune locales list`**, fix spelling, or **`generate`** the locale first. For **`missing --target`**, missing targets are skipped with a warning while other valid targets continue; suggestions are shown only when an existing locale or catalog-backed code match is clear.

---

## `source_placeholder_leaves`

**Code:** `i18nprune.locale.source_placeholder_leaves`  
**Severity:** `warning`  
**When:** the source locale file contains the configured missing placeholder value (for example `__I18NPRUNE_MISSING__`).  
**Who:** **`validate`**, **`missing`**, **`sync`**, **`quality`**, **`review`**, and shared core placeholder checks.  
**What to do:**
1. Run **`i18nprune missing --full`** to list every source placeholder path with its locale file and best-effort JSON line.
2. Manually review the listed source paths and replace each placeholder with the real source-language value.
3. Run **`i18nprune sync`** so non-source locale files align to the corrected source shape.
4. Run **`i18nprune generate --resume`** to refill target translations that still need translation work.

---

## `target_placeholder_leaves`

**Code:** `i18nprune.locale.target_placeholder_leaves`  
**Severity:** `warning`  
**When:** a non-source locale file contains the configured missing placeholder value (for example `__I18NPRUNE_MISSING__`).  
**Who:** **`missing --target`**, **`sync`**, **`quality`**, **`review`**, and shared core placeholder checks.  
**What to do:**
1. Run **`i18nprune missing --target <locale> --full`** to list every placeholder path in that target locale with its file and best-effort JSON line.
2. Run **`i18nprune sync`** to align the target locale with the source locale shape.
3. Run **`i18nprune generate --resume`** to translate the placeholder paths.
