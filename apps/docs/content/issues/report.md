# Report — issue codes (`i18nprune.report.*`)

[← Issue codes index](.)

## `invalid_format`

**Severity:** `error`  
**When:** **`report`** receives an invalid **`--format`** value (anything outside `html`, `json`, `csv`, `text`).  
**Who:** **`report`** command argument parsing path. In **`--json`** mode, this is emitted inside a `CliJsonEnvelope` with this issue code instead of logger-only text.  
**What to do:** Pass a supported value, for example `--format json`.
