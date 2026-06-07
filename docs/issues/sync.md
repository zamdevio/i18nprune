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
**What to do:** Treat it as a precedence notice: strip wins and leaves are written as plain strings (`legacy_string` mode). Remove one flag for clearer intent. See [Sync metadata flag conflict](../commands/sync.md#metadata-flag-conflict) and [Locales config metadata mode](../config/locales.md#leaf-metadata-mode).

---

## `scan_extras_retained`

**Severity:** `info`  
**When:** A synced **target** locale still has key paths **extra vs the code scan**, but **`sync` retained them** (human log shows **`0 extra path(s) removed (not in source)`** for that file). Typical when uncertain-prefix protect keeps branches for dynamic key sites.  
**Who:** **`sync`**, **`runSync`**.  
**What to do:** This is not a failure. **`sync`** aligns to **scan ∩ source** and is conservative around dynamic keys. To preview **scan-based** removal from the target file, run:

```bash
i18nprune cleanup --target <code> --dry-run
```

Review output, then apply with **`cleanup --target <code> --yes`** or **`--ask`**. Optional: **`--rg`** for a substring presence guard. See [Sync vs tips vs cleanup](../commands/sync.md#sync-vs-tips-vs-cleanup-different-datasets).
