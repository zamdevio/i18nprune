# Cli — issue codes (`i18nprune.cli.*`)

[← Issue codes index](.)

## `invalid_json_pretty`

**Severity:** `error`  
**When:** Global **`--json-pretty`** receives a non-boolean value (expected `true`/`false`, with aliases like `1/0`, `yes/no`).  
**Who:** Global CLI option parsing path before command execution.  
**What to do:** Pass a valid boolean, for example `--json-pretty false`.
