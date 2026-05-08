# Cleanup — issue codes (`i18nprune.cleanup.*`)

[← Issue codes index](.)

## `uncertain_paths_excluded`

**Severity:** `info`  
**When:** **`cleanup`** excluded paths under **uncertain** key prefixes per **`reference`** / policy.  
**Who:** **`cleanup`**, **`runCleanupCheck`**.  
**What to do:** Expected informational signal; tighten **`reference`** / policies if exclusions are wrong.

---

## `ripgrep_unavailable`

**Severity:** `warning`  
**When:** **`rg`** is not on **`PATH`** and cleanup would use it for safer reference checks.  
**Who:** **`cleanup`**, **`runCleanupCheck`**.  
**What to do:** Install [ripgrep](https://github.com/BurntSushi/ripgrep) for stronger safety.
