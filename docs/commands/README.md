---
description: Index of i18nprune subcommands with links to per-command docs, flags, and JSON envelope parity.
---

# Commands

Each subcommand has a dedicated page. The CLI prints a **Documentation** link at the bottom of `help` output (see **`getDocsUrl` / `docsCommandUrl`** in **`@i18nprune/core`**).

Architecture rule: command files are orchestrators; reusable logic belongs in `core/` (or shared `utils/`). See [ADR 006 command orchestrator boundary](../architecture/decisions/006-command-orchestrator-boundary.md).

## Manual verification after doc updates

- Run jq examples from [JSON output (`--json`)](../cli/json.md) and [jq cookbook](../examples/jq-cookbook.md) directly in your shell.
- Confirm each snippet still works against current envelope fields (`ok`, `kind`, `data`, `issues`, `meta`).
- If a snippet fails, update the docs example first, then re-run the command and jq filter.

### Command source layout (`packages/cli/src/commands/`)

- **`commands/<name>/index.ts`** — re-exports only (e.g. `export { sync } from './run.js'`).
- **`commands/<name>/run.ts`** — **primary exported handler first** (right after imports), private helpers below. Handler named after the **CLI subcommand** (e.g. `sync()`, `generate()`, `missing()`). The `locales` command uses **`localesList`**, **`localesEdit`**, **`localesDynamic`**, **`localesDelete`** for its sub-actions.
- **Other files in the folder** — optional splits (`summary.ts`, `targets.ts`, …) for orchestration and CLI output, not domain engines.

**`help` (locked):** no `help()` runner — **`configureCliHelp`** and **`colorizeHelpText`** only (`help/run.ts`). See [help](./help.md).

Domain behavior stays in `packages/cli/src/core/**`. Rationale: [ADR 006](../architecture/decisions/006-command-orchestrator-boundary.md).

| Command | Docs |
|---------|------|
| `init` | [init](./init.md) |
| `config` | [config](./config.md) |
| `validate` | [validate](./validate.md) |
| `missing` | [missing](./missing.md) |
| `sync` | [sync](./sync.md) |
| `generate` | [generate](./generate.md) (includes **`--resume`** for existing targets) |
| `quality` | [quality](./quality.md) |
| `review` | [review](./review.md) |
| `cleanup` | [cleanup](./cleanup.md) |
| `languages` | [languages](./languages.md) |
| `providers` | [providers](./providers.md) |
| `doctor` | [doctor](./doctor.md) |
| `help` | [help](./help.md) |
| `report` | [report](./report.md) |
| `share` | [share](./share/README.md) (`upload`, `list`, `view`, `delete`) |

**`locales`:** [list](./locales/list.md), [dynamic](./locales/dynamic.md), [delete](./locales/delete.md).

Subcommands use **full names only** (no short aliases like `gen` / `val`). Exception: **`languages`** also accepts the positional alias **`langs`** (`i18nprune langs`).

See also [CLI overview](../cli/README.md).
