# Config — issue codes (`i18nprune.config.*`)

[← Issue codes index](.)

These codes are emitted by **`tryLoadCoreConfigFromPath`** and related programmatic config paths when loading **`i18nprune.config.*`** (or host JSON) fails.

---

## `missing`

**Code:** `i18nprune.config.missing`  
**Severity:** `error`  
**When:** The requested config file path does not exist (**`ENOENT`**).  
**Who:** **`tryLoadCoreConfigFromPath`** (and callers using the same normalization).  
**What to do:** Create a config file, fix **`--config`**, or run from a directory that contains **`i18nprune.config.*`**.

---

## `invalid`

**Code:** `i18nprune.config.invalid`  
**Severity:** `error`  
**When:** The file could be read but **JSON.parse** failed (**`SyntaxError`**).  
**Who:** **`tryLoadCoreConfigFromPath`**.  
**What to do:** Fix JSON syntax at the path shown in **`path`** / **`message`**.

---

## `load_failed`

**Code:** `i18nprune.config.load_failed`  
**Severity:** `error`  
**When:** Config load failed for a reason other than missing file or JSON syntax (normalized unknown error).  
**Who:** **`tryLoadCoreConfigFromPath`**.  
**What to do:** Read **`message`** and underlying **`cause`**; verify permissions and runtime.
