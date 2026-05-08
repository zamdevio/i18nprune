# Sync — issue codes (`i18nprune.sync.*`)

[← Issue codes index](./README.md)

## `locale_file_not_found`

**Severity:** `warning`  
**When:** **`sync --target`** requested a locale basename with **no** matching **`*.json`** under **`localesDir`** (skipped).  
**Who:** **`sync`**, **`runSync`**.  
**What to do:** Create the locale file (e.g. **`generate`**) or fix **`--target`** spelling.

---

## `metadata_flag_conflict`

**Severity:** `warning`  
**When:** **`sync`** receives both metadata-write intent and strip intent in the same run (for example `--metadata` and `--strip-metadata`).  
**Who:** **`sync`**, **`runSync`**.  
**What to do:** Treat it as a precedence notice: strip wins and leaves are written as plain strings (`legacy_string` mode). Remove one flag for clearer intent. See [Locales metadata mode](../locales/metadata/README.md).
