# Command behavior snapshot

High-level **inputs**, **outputs**, **failure modes**, and **where to read more**. For details, follow the link in each row.

When **JSON** is **Yes**, structured stdout uses the envelope documented in **[JSON output (`--json`)](../json/README.md)** (`ok`, `kind`, `data`, …).

| Command | Inputs (flags / env) | Stdout / stderr | JSON | Notes |
|---------|-------------------|-----------------|------|--------|
| `init` | `--yes`, prompts | Human | No | Creates config when missing. |
| `config` | global `--config` | Resolved config | **Yes** | `fieldSources`, paths. |
| `validate` | `--source`, `--locales-dir`, global overrides | Human or JSON | **Yes** | Keys vs source. |
| `sync` | `--dry-run`, `--lang`, `--metadata`, `--strip-metadata` | Human or JSON | **Yes** | Merge/prune to source shape; shared locale metadata writer mode. |
| `generate` | `--lang`, `--source`, `--force`, `--dry-run`, meta flags, `--metadata` | Human; stderr progress when allowed | **Yes** | **Requires `--lang`** when non-interactive; catalog validation; **no** Inquirer prompts with **`--json`**. See [generate](../commands/generate/README.md). |
| `missing` | `--locale`, `--dry-run`, `--top`, `--full-list`, global `stdout redirection`, global `--yes` | Human or JSON | **Yes** | Scaffold keys into **source** locale JSON or `locales/<code>.json`. See [missing](../commands/missing/README.md). |
| `fill` | `--target`, `--all`, `--dry-run`, `--ask`, `--metadata` | Human or JSON; stderr progress when allowed (human) | **Yes** | **Requires `--target` or `--all`** when non-interactive; same translation pipeline as **`generate`**. See [fill](../commands/fill/README.md). |
| `quality` | `--lang` | Human or JSON | **Yes** | Parity / drift. |
| `review` | `--lang` | Human or JSON | **Yes** | Locale vs source. |
| `cleanup` | `--check-only`, `--skip-rg` | Human or JSON | **Yes** | Unused keys. |
| `languages` | `--filter`, `--table` | Human or JSON | **Yes** | Catalog list. |
| `locales` (`list`, `edit`, `dynamic`, `delete`) | `--target` where applicable, global `--yes` for destructive JSON | Human or JSON | **Yes** (per subcommand) | **`list`**: inventory + counts; **`edit`**: meta sidecar; **`dynamic`**: validate-style dynamic scan; **`delete`**: remove locale files. See [locales](../commands/locales/README.md). |
| `doctor` | `--only`, `--strict` | Human or JSON | **Yes** | Read-only diagnostics. |
| `help` | — | Help text | No | Styled `formatHelp`. |

**Global flags** (see [CLI overview](../cli/README.md)): `--config`, `--yes`, `--json`, `-q` / `-s`, `--source`, `--locales-dir`, `--src`, `--functions`, `--exclude`.

**Non-interactive** (`CI`, no TTY, `I18NPRUNE_NO_INIT`, or command-specific **`run.json`**): no prompts; **fail fast** on missing required flags — see [Exit codes & behavior](./README.md) and [JSON & long](./json-long.md).

**Translator** (generate / fill): shared **`translateLeaf`** + provider; see [Translator & progress](../translator/README.md).

**Dry-run** (`--dry-run`): implemented for **`generate`**, **`fill`**, and **`sync`** — no writes under **`localesDir`**; human mode prints **`[info]`** lines that state nothing was written. Other commands do not expose **`--dry-run`** until there is a clear “would do X” contract.

**Source locale:** the basename of the configured **source** JSON (e.g. `en`) is **not** a valid **`--lang`** for **`generate`** / **`fill`**, or **`sync`**. Locale slug hints (e.g. **`locales edit`**) omit the source file from “expected one of …” lists.
