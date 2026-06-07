---
description: Locales subcommand usage issue codes and CLI argument validation for list, dynamic, and delete.
---

# Locales — issue codes (`i18nprune.locales.*`)

[← Issue codes index](./README.md)

## `usage`

**Severity:** `error`  
**When:** A **`locales`** subcommand is invoked without required arguments or flags for the current mode (e.g. non-interactive **`locales edit`** without **`--target`**).  
**Who:** **`locales list`**, **`locales edit`**, **`locales dynamic`**, **`locales delete`** (and programmatic equivalents).  
**What to do:** Pass the documented **`--target`** / flags, or run interactively in a TTY. See [commands/locales](../commands/locales/README.md).
