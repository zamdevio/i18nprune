# Io — issue codes (`i18nprune.io.*`)

[← Issue codes index](./README.md)

## `read_failed`

**Severity:** `error`  
**When:** A command that supports **`--json`** could not complete because of **filesystem or JSON parse** failure while building the normal payload (same class of problems as unreadable locale files, but outside **`validate`**’s dedicated code).  
**Who:** **`missing`**, **`sync`**, **`quality`**, **`review`**, **`cleanup`**, **`generate`**, **`report`**, etc., when their **`run*`** paths catch I/O errors. **`path`** may mirror **`errno`**’s path when available.  
**What to do:** Read **`message`**, fix the file path or JSON content, then re-run. Prefer **`--config`** / a single config file in CI. See [Behavior](../behavior/README.md).
