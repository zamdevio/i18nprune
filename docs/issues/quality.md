---
description: Quality issue codes — english_identical_leaves parity warnings between source and targets.
---

# Quality — issue codes (`i18nprune.quality.*`)

[← Issue codes index](./README.md)

## `english_identical_leaves`

Stable issue id (historical name); behavior is **source-identical** vs the configured **source** locale, not necessarily English.

**Severity:** `info`  
**When:** Target locale leaves still **match** the source string (parity / copy candidates).  
**Who:** **`quality`**, **`runQuality`**.  
**What to do:** Use **`generate --resume`**, **`generate`**, or manual translation as appropriate.
