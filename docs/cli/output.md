---
description: Global CLI flags for plain text output, NO_COLOR, and grep-friendly log lines without channel tags.
---

# Log presentation (`--no-color`, log tags)

Global flags control **how** human log lines look. They do **not** change exit codes, `--json` envelopes, issue codes, or which messages print — that stays with [`--json`](./json.md), [`--quiet`](./verbosity.md), and [`--silent`](./verbosity.md).

Set from **`packages/cli/bin/cli.ts`** into **`RunOptions`** (`noColor`, `noLogChannel`, `noLogPrefix`). Formatting lives in **`packages/cli/src/utils/ansi/index.ts`** and **`packages/cli/src/utils/style/index.ts`**.

## Flags

| Flag | Effect | Default |
|------|--------|---------|
| **`--no-color`** | Plain text — no chalk/ANSI wrappers on styled output | color when supported |
| **`--no-log-channel`** | Drop `[info]`, `[warn]`, `[tip]`, `[cache]`, `[scan]`, `[verbose]` tags; keep message body | tags on |
| **`--no-log-prefix`** | Drop `[i18nprune]` app prefix on logger lines (including **`logger.err`**) | prefix on |

## `NO_COLOR`

The CLI honors the [NO_COLOR](https://no-color.org/) convention: if `NO_COLOR` is set in the environment (any value), color is disabled the same as **`--no-color`**.

```bash
# Plain output without passing a flag
NO_COLOR=1 i18nprune validate -q

# Explicit flag (identical plain styling when color would otherwise apply)
i18nprune validate -q --no-color
```

## Combinations

```bash
# Grep-friendly single-token lines (no prefix, no tags, no color):
i18nprune validate --no-color --no-log-prefix --no-log-channel

# CI: colors off via env, keep normal prefix/tags:
NO_COLOR=1 i18nprune validate -q
```

**`--quiet` / `--silent`** still gate *what* prints. Presentation flags only affect lines that survive those gates (for example, warnings under **`-q`**).

## Parity / CI snapshots

Human stderr parity fixtures under `tests/parity/` spawn the CLI with **`NO_COLOR=1`** (via `paritySpawnEnv`) so snapshots stay plain and stable across terminals. JSON parity is unchanged.

## Related

- [Quiet, silent & JSON](./verbosity.md)
- [CLI overview](./README.md)
