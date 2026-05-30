# Commands

Each subcommand has a dedicated page. The CLI prints a **Documentation** link at the bottom of `help` output (see **`getDocsUrl` / `docsCommandUrl`** in **`@i18nprune/core`**).

**Full examples index:** [docs/examples/commands](../examples/commands/README.md)

Architecture rule: command files are orchestrators; reusable logic belongs in `core/` (or shared `utils/`). See [command orchestration boundary](./orchestration/README.md).

### Command source layout (`packages/cli/src/commands/`)

- **`commands/<name>/index.ts`** — re-exports only (e.g. `export { sync } from './run.js'`).
- **`commands/<name>/run.ts`** — **primary exported handler first** (right after imports), private helpers below. Handler named after the **CLI subcommand** (e.g. `sync()`, `generate()`, `missing()`). The `locales` command uses **`localesList`**, **`localesEdit`**, **`localesDynamic`**, **`localesDelete`** for its sub-actions.
- **Other files in the folder** — optional splits (`summary.ts`, `targets.ts`, …) for orchestration and CLI output, not domain engines.

**`help` (locked):** no `help()` runner — **`configureCliHelp`** and **`colorizeHelpText`** only (`help/run.ts`). See [help](./help/README.md).

Domain behavior stays in `packages/cli/src/core/**`. Table and rationale: [Command orchestration boundary — file layout](./orchestration/README.md#file-layout-inside-a-command-package).

| Command | Docs |
|---------|------|
| `init` | [init](./init/README.md) |
| `config` | [config](./config/README.md) |
| `validate` | [validate](./validate/README.md) |
| `missing` | [missing](./missing/README.md) |
| `sync` | [sync](./sync/README.md) |
| `generate` | [generate](./generate/README.md) (includes **`--resume`** for existing targets) |
| `quality` | [quality](./quality/README.md) |
| `review` | [review](./review/README.md) |
| `cleanup` | [cleanup](./cleanup/README.md) |
| `languages` | [languages](./languages/README.md) |
| `providers` | [providers](./providers/README.md) |
| `doctor` | [doctor](./doctor/README.md) |
| `help` | [help](./help/README.md) |
| `report` | [report](./report/README.md) |
| `share` | [share](./share/README.md) (`upload`, `list`, `view`, `delete`) |

**`locales`:** [list](./locales/list/README.md), [edit](./locales/edit/README.md), [dynamic](./locales/dynamic/README.md), [delete](./locales/delete/README.md).

Global **`--version`** / **`-v`**: [version](./version/README.md).

Subcommands use **full names only** (no short aliases like `gen` / `val`). Exception: **`languages`** also accepts the positional alias **`langs`** (`i18nprune langs`).

See also [CLI overview](../cli/README.md).
