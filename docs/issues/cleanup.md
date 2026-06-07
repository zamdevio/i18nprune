# Cleanup — issue codes (`i18nprune.cleanup.*`)

[← Issue codes index](./README.md)

## `uncertain_paths_excluded`

**Severity:** `info`  
**When:** **`cleanup`** excluded paths under **uncertain** key prefixes per **`reference`** / policy.  
**Who:** **`cleanup`**, **`runCleanupCheck`**.  
**What to do:** Expected informational signal; tighten **`reference`** / policies if exclusions are wrong.

---

## `ripgrep_unavailable`

**Severity:** `warning`  
**When:** **`cleanup --rg`** was requested but **`rg`** is not on **`PATH`** (and **`reference.stringPresence`** is not **`off`**).  
**Who:** **`cleanup`**, **`runCleanup`**.  
**What to do:** Install [ripgrep](https://github.com/BurntSushi/ripgrep) or omit **`--rg`** to use the static scan only.
