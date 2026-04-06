# Exit codes, signals, and interactivity

How the CLI behaves when things go wrong, when you press **Ctrl+C**, and when runs are **non-interactive** (CI, scripts, `--json`).

## Exit codes

| Code | Typical meaning |
|------|------------------|
| **0** | Success — command finished; **`doctor`** with no errors (and no **`--strict`** warn failures). |
| **1** | Failure — validation error, **`I18nPruneError`**, **`doctor`** with **`error`** findings (or **`warn`** when **`--strict`**), **multiple config files** without **`--config`** in non-interactive mode, or other handled errors. |
| **2** | **Usage** — reserved for **`USAGE`**-class errors (e.g. missing required flags in some flows). |
| **130** | **SIGINT** during a **long interactive session** (e.g. **`generate`** / **`fill`** progress UI) — cooperative cancel; see below. |

Unhandled exceptions are normalized by **`reportCliError`** (see `src/core/errors/handler.ts`) and usually map to exit **1** (or **2** for usage).

Commands that only set **`process.exitCode`** (e.g. **`doctor`**) rely on Node exiting with that code when the process ends normally.

## SIGINT (Ctrl+C)

- **Default:** For most short commands, Node’s default applies: the process may exit with **128 + signal number** (often **130** for SIGINT) unless the runtime handles it differently.
- **Generate / fill session:** While the translation **progress session** is active (`src/core/progress/session.ts`), **SIGINT** is caught: cursor is restored, stdin handling is detached, and the process exits with **130** — a deliberate “user cancelled” convention (similar to many CLIs).

There is **no** global SIGINT handler on the root **`bin/cli.ts`**; behaviour is **per feature** where raw TTY / progress is used.

## Non-interactive vs interactive

| Situation | Behaviour |
|-----------|-----------|
| **TTY + no `CI` / `I18NPRUNE_NO_INIT`** | Prompts allowed (`init` format, duplicate-config pick, **`generate`** language prompts when applicable). |
| **No TTY, `CI=1`, or `I18NPRUNE_NO_INIT=1`** | **`shouldSkipInteractivePrompts()`** is true — no prompts; **`init`** uses **`--yes`** semantics where documented. |
| **Global `--json` present** | Duplicate-config resolution treats this as **non-interactive** → **exit 1** if multiple config files exist without **`--config`** (even for commands that do not emit JSON). **Structured JSON on stdout** only for commands listed in `src/constants/jsonoutput.ts`. For **`generate`**, **`run.json`** also suppresses Inquirer prompts (same inputs as other non-interactive runs). |
| **Top command banner** | Runtime commands: **`maybePrintCommandBanner`** (**off** for **`--json`** / **silent**; **on** for **quiet**). **`help`** skips that hook — help text always prepends one box in **`formatHelp`** (same for **`--help`** on any command). Title from **`toolDisplayTitle`** (e.g. **`Locales List`**); subtitle from **`COMMAND_BANNER_LABELS`** / description. Icon **`CLI_MARK`** in `src/constants/cli.ts`. |
| **Multiple `i18nprune.config.*` files** | Interactive: choose which file to use. Non-interactive: **error** and **exit 1** — use **`--config <path>`** or remove extra files. |

### `generate` (non-interactive & catalog)

When prompts are skipped, **`generate`** requires **`--lang`**. The code must exist in the bundled **`languages.json`** catalog; otherwise the command **fails with a non-zero exit** and an error that suggests **`i18nprune languages`**. For valid codes, **English** and **native** labels default from the catalog unless overridden by flags. **Direction** defaults to **`ltr`**; the catalog does not store direction yet — use **`--direction rtl`** for RTL. See [commands/generate](../commands/generate/README.md). Sequencing: [Roadmap](../roadmap/README.md); maintainer checklist: **`CURRENT_PHASE.md`** (gitignored).

## Warnings vs errors

- **`logger.warn`** only prints to stderr — it does **not** set **`process.exitCode`**. Exit codes are chosen by each command.
- **`doctor --strict`** exits **1** when any finding has severity **`warn`** or **`error`** (`exitCodeFor` in `src/commands/doctor/index.ts`). Findings are printed with **`logger.warn`** / **`logger.err`** for display, but the exit code comes from **`doctor`**, not from the logger.
- **`validate`** reports **missing keys** as warnings in human mode; **`--json`** still returns structured data — check your script for **`missing.length`** if you need a failing CI gate.

## Related

- [Command behaviors](./commands.md) — snapshot of every command (flags, JSON, notes)
- [Auto-patching](../patching/README.md) — opt-in loader/config edits (when enabled)
- [Roadmap](../roadmap/README.md) — product direction (`--report-file`, `review`, `locales`, …)
- [JSON mode and long commands](./json-long.md) — `--json` with prompts, progress, and `generate` / `fill` / `sync`
- [Verbosity & JSON](../cli/verbosity/README.md) — `--quiet`, `--silent`, `--json`
- [Config](../config/README.md) — config file discovery order
- [Barriers: dynamic keys](../barriers/dynamic-keys.md) — what we cannot automate
