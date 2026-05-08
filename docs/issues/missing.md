# Missing — issue codes (`i18nprune.missing.*`)

[← Issue codes index](./README.md)

## `paths_not_in_current_scan`

**Severity:** `warning`  
**When:** External missing-path inputs (if used by API/programmatic callers) include paths not present in the **current** code scan.  
**Who:** **`missing`**, **`runMissing`**.  
**What to do:** Re-scan the project and drop stale paths.
