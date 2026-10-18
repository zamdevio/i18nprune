---
description: The `version` command — print the CLI/SDK versions, check npm for a newer release, show release notes for the installed CLI and Core, and reset the update cache.
---

# `version`

Prints the CLI and SDK versions and manages the cached npm update check.

```bash
i18nprune version            # current CLI + SDK versions
i18nprune version --check    # query npm for the latest and show install hints
i18nprune version --notes    # release notes for the installed CLI and Core
i18nprune version --reset    # clear the cached update check
```

`-V` / `--version` is shorthand for `i18nprune version`.

## `--notes`

Shows the release notes for the **installed CLI** and **`@i18nprune/core`** — the CLI bundles
core, so both lines matter. Notes are read from the releases portal's machine-readable
endpoints (see [Release data](../releases.md)):

```text
/releases/cli/<version>.json
/releases/core/<version>.json
```

- **Best-effort:** offline, or a version not yet published, prints a warning instead of failing.
- **Styled but plain-safe:** the block stays readable when color is off (`--no-color` / non-TTY).

```bash
i18nprune version --notes
```

## `--check`

Queries the npm registry for the latest published `i18nprune` and prints install instructions
when a newer version exists. Skipped when `I18NPRUNE_NO_UPDATE_CHECK` is set — see
[Update checks & version throttle](../cli/cache.md).

## `--reset`

Clears the cached update check so the next run looks up the latest version again.
