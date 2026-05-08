# Fill — issue codes (`i18nprune.fill.*`)

[← Issue codes index](.)

## `usage`

**Code:** `i18nprune.fill.usage`  
**Severity:** `error`  
**When:** **`fill`** cannot determine targets in non-interactive mode (**`--json`**, CI, no TTY): missing **`--target`** and **`--all`**, or there are no locale files to fill besides the source.  
**Who:** **`runFill`**, **`executeFillWithTargets`** (`packages/cli`); **`resolveFillTargetCodesFromRaw`**, **`resolveFillAllTargetCodes`** (`@i18nprune/core`).  
**What to do:** Pass **`--target <code>`** (or comma-separated list), or **`--all`**, and ensure **`localesDir`** has at least one non-source locale JSON. See [commands/fill](../commands/fill).
