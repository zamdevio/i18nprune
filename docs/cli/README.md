# CLI overview

`i18nprune` is a Node 18+ ESM CLI built with **Commander**. The entry point is **`packages/cli/bin/cli.ts`**, compiled to **`dist/cli.js`**.

## Global behaviour

1. **Argv** is passed through **`preprocessArgv`** (`packages/cli/src/argv/index.ts`) before Commander parses it.
2. **`preAction`** on the root command:
   - Resolves **`setConfigPath`**, **`ensureConfigPathResolved`** (duplicate config files), **`setRunOptions`**, **`setCliGlobalOverrides`**, clears context cache.
   - Does **not** create a config file: use **`i18nprune init`** when **`i18nprune.project.config_file_missing`** applies.
3. **`RunOptions`** (`json`, `quiet`, `silent`) is the **process-wide** verbosity contract; commands read it via **`getRunOptions()`** or **`resolveContext().run`**. There is **no** separate JSON envelope flag: when JSON is emitted, it **always** uses the envelope shape documented under [JSON output (`--json`)](../json/README.md).

## Subcommands

Use the **canonical command name** (e.g. `generate`, `validate`, `languages`). There are **no** short Commander aliases (`gen`, `val`, …).

The **`languages`** command accepts the positional alias **`langs`** (`i18nprune langs`). It does not load project config.

## Global flags (short)

| Flag | Long | Role |
|------|------|------|
| `-v` | `--version` | Print version — see [version](../commands/version/README.md) |
| `-q` | `--quiet` | Less noise (see [verbosity](./verbosity/README.md)) |
| `-s` | `--silent` | Stricter suppression |
| `-h` | `--help` | Help (Commander default) |
| `-c` | `--config` | Path to a single `i18nprune` config file |

Other global options use **`--long`** only (`--json`, `--yes`, `--source`, …) besides **`-c` / `--config`**.

## Global `--json`

Full behavior, envelope shape, supported commands, and edge cases: **[JSON output (`--json`)](../json/README.md)**.

## Related

- [Commands index](../commands/README.md)
- [CLI disk cache (`~/.i18nprune/cache`)](./cache.md)
- [CLI prompt modules](./prompts/README.md)
- [Quiet, silent & JSON](./verbosity/README.md)
- [CLI runtime](./runtime/README.md)
