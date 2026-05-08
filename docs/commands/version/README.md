# `version`

**Full examples index:** [command examples](../../examples/commands/README.md)

Print the **running CLI semver** or **query npm** for a newer release.

## Usage

```bash
i18nprune version
i18nprune version --check
i18nprune version --reset
i18nprune version --reset --check
```

- **`version`** — prints a single line (same value as **`i18nprune --version`** / **`-v`**).
- **`version --check`** — fetches **`i18nprune`** **`latest`** from the **npm registry**, prints current vs published, and suggests **`npm i -g i18nprune`** when an upgrade exists. Respects **`I18NPRUNE_NO_UPDATE_CHECK`** (see [Environment variables](../../config/env.md) and [Versioning](../../versioning/README.md)).
- **`version --reset`** — clears the cached npm update check so the next background lookup is not blocked by the 24h throttle. Combine with **`--check`** to clear then query npm immediately. (On-disk details: [Versioning](../../versioning/README.md).)
- **`-v` / `--version`** on the root CLI are treated like **`version`** when no other subcommand is given (same banner / quiet / silent behavior); see [CLI verbosity](../../cli/verbosity/README.md).

Global **`--json`** does not change this command’s output shape in v1; prefer plain text here.

## Exit codes

- **0** — Success (including registry errors handled as warnings for `--check`).
