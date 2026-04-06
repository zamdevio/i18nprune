# Command behavior snapshot

High-level **inputs**, **outputs**, **failure modes**, and **where to read more**. For details, follow the link in each row.

| Command | Inputs (flags / env) | Stdout / stderr | JSON | Notes |
|---------|-------------------|-----------------|------|--------|
| `init` | `--yes`, prompts | Human | No | Creates config when missing. |
| `config` | global `--config` | Resolved config | **Yes** | `fieldSources`, paths. |
| `validate` | `--source`, `--locales-dir`, global overrides | Human or JSON | **Yes** | Keys vs source. |
| `sync` | `--dry-run`, `--lang` | Human or JSON | **Yes** | Merge/prune to source shape. |
| `generate` | `--lang`, `--source`, `--force`, `--dry-run`, meta flags | Human; stderr progress when allowed | **Yes** | **Requires `--lang`** when non-interactive; catalog validation; **no** Inquirer prompts with **`--json`**. See [generate](../commands/generate/README.md). |
| `fill` | `--lang`, `--dry-run` | Human; stderr progress when allowed | **Yes** | **Requires `--lang`**; re-translates leaves still matching source. |
| `quality` | `--lang` | Human or JSON | **Yes** | Parity / drift. |
| `review` | `--lang` | Human or JSON | **Yes** | Locale vs source. |
| `cleanup` | `--check-only`, `--skip-rg` | Human or JSON | **Yes** | Unused keys. |
| `languages` | `--filter`, `--table` | Human or JSON | **Yes** | Catalog list. |
| `locales` / `locales list` / `locales edit` | varies | Human | Varies | See command help. |
| `doctor` | `--only`, `--strict` | Human or JSON | **Yes** | Read-only diagnostics. |
| `help` | — | Help text | No | Styled `formatHelp`. |

**Global flags** (see [CLI overview](../cli/README.md)): `--config`, `--yes`, `--json`, `-q` / `-s`, `--source`, `--locales-dir`, `--src`, `--functions`, `--no-discovery`.

**Non-interactive** (`CI`, no TTY, `I18NPRUNE_NO_INIT`, or command-specific **`run.json`**): no prompts; **fail fast** on missing required flags — see [Exit codes & behavior](./README.md) and [JSON & long](./json-long.md).

**Translator** (generate / fill): shared **`translateLeaf`** + provider; see [Translator & progress architecture](../architecture/translator-and-progress.md).

**Dry-run** (`--dry-run`): implemented for **`generate`**, **`fill`**, and **`sync`** — no writes under **`localesDir`**; human mode prints **`[info]`** lines that state nothing was written. Other commands do not expose **`--dry-run`** until there is a clear “would do X” contract.

**Source locale:** the basename of the configured **source** JSON (e.g. `en`) is **not** a valid **`--lang`** for **`generate`** / **`fill`**, or **`sync`**. Locale slug hints (e.g. **`locales edit`**) omit the source file from “expected one of …” lists.
