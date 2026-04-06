# CLI overview

`i18nprune` is a Node 18+ ESM CLI built with **Commander**. The entry point is **`bin/cli.ts`**, compiled to **`dist/cli.js`**.

## Global behaviour

1. **Argv** is passed through **`preprocessArgv`** (`src/argv/index.ts`) before Commander parses it.
2. **`preAction`** on the root command:
   - Resolves **`setConfigPath`**, **`ensureConfigPathResolved`** (duplicate config files), **`setRunOptions`**, **`setCliGlobalOverrides`**, clears context cache.
   - Skips **`ensureConfig`** for **`init`**, **`config`**, **`languages`**, **`help`**, **`review`**, **`doctor`** so those work without creating a config file first.
3. **`RunOptions`** (`json`, `quiet`, `silent`) is the **process-wide** verbosity contract; commands read it via **`getRunOptions()`** or **`resolveContext().run`**.

## Subcommands

Use the **canonical command name** (e.g. `generate`, `validate`, `languages`). There are **no** short Commander aliases (`gen`, `val`, …).

Optional convenience: if the first argv token after the binary is **`--langs`**, it is rewritten to **`languages`** before parsing (`DOUBLE_DASH_TO_CANONICAL` in `src/argv/index.ts`).

## Global flags (short)

| Flag | Long | Role |
|------|------|------|
| `-v` | `--version` | Print version — see [version](../commands/version/README.md) |
| `-q` | `--quiet` | Less noise (see [verbosity](./verbosity/README.md)) |
| `-s` | `--silent` | Stricter suppression |
| `-h` | `--help` | Help (Commander default) |

Other global options use **`--long`** only (`--config`, `--json`, `--yes`, `--source`, …).

## Global `--json`

- The flag is **always parsed** on the root program (and counts as **non-interactive** for duplicate-config resolution — e.g. multiple `i18nprune.config.*` without **`--config`** → exit **1** in CI / when stdin is not a TTY).
- **Structured JSON on stdout** is only emitted by commands that support it (`config`, `validate`, `review`, `doctor`, `sync`, `generate`, `quality`, `cleanup`, `languages`, … — see `src/constants/jsonoutput.ts`). Commands such as **`init`** or **`help`** do **not** emit a JSON document; they behave in **human** output mode for messages (verbosity still follows **`-q` / `-s`**).

## Related

- [Commands index](../commands/README.md)
- [Quiet, silent & JSON](./verbosity/README.md)
- [CLI runtime](./runtime/README.md)
