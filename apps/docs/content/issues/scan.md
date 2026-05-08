# Scan — issue codes (`i18nprune.scan.*`)

[← Issue codes index](.)

## `dynamic_key_sites`

**Severity:** `warning`  
**When:** Same **non-literal call sites** story as validate, emitted on commands that align locale JSON or report parity (**`sync`**, **`cleanup`**, **`quality`**, **`review`**, **`generate`**, **`report`**, …).  
**Who:** Shared helper **`issuesFromDynamicScanCount`**.  
**What to do:** Same as dynamic keys for validate — document and handle at runtime.
