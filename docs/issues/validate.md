---
description: Validate issue codes — missing_literal_keys, dynamic_key_sites, and source_locale_unreadable.
---

# Validate — issue codes (`i18nprune.validate.*`)

[← Issue codes index](./README.md)

## `missing_literal_keys`

**Severity:** `warning`  
**When:** Literal translation keys appear in scanned sources but not in the **source** locale JSON.  
**Who:** **`validate`**, **`runValidate`**.  
**What to do:** Add keys to the source locale, remove dead calls, or adjust **`functions`** / scan roots. See [commands/validate](../commands/validate.md).

---

## `dynamic_key_sites`

**Severity:** `warning`  
**When:** Call sites use **non-literal** keys (computed / variable keys). Static analysis cannot enumerate them.  
**Who:** **`validate`**, **`runValidate`**.  
**What to do:** Treat as documentation: ensure runtime key coverage by other means; see [dynamic key extraction](../architecture/extraction/dynamic.md).

---

## `source_locale_unreadable`

**Severity:** `error`  
**When:** The configured **source locale JSON** cannot be read or parsed (missing file, permission, **invalid JSON**).  
**Who:** **`validate`**, **`runValidate`** — **`validate --json`** still prints **one** stdout envelope (does not throw before JSON).  
**What to do:** Fix **`source`** path, file permissions, or JSON syntax. See [Config](../config/README.md).
