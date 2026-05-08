# Commands

Each subcommand has a dedicated page. The CLI prints a **Documentation** link at the bottom of `help` output (see **`getDocsUrl` / `docsCommandUrl`** in **`@i18nprune/core`**).

**Full examples index:** [docs/examples/commands](../examples/commands)

Architecture rule: command files are orchestrators; reusable logic belongs in `core/` (or shared `utils/`). See [command orchestration boundary](./orchestration).

### Command source layout (`packages/cli/src/commands/`)

- **`commands/<name>/index.ts`** — re-exports only (e.g. `export { sync } from './run.js'`).
- **`commands/<name>/run.ts`** — **primary exported handler first** (right after imports), private helpers below. Handler named after the **CLI subcommand** (e.g. `sync()`, `generate()`, `missing()`). The `locales` command uses **`localesList`**, **`localesEdit`**, **`localesDynamic`**, **`localesDelete`** for its sub-actions.
- **Other files in the folder** — optional splits (`summary.ts`, `targets.ts`, …) for orchestration and CLI output, not domain engines.

**`help` (locked):** no `help()` runner — **`configureCliHelp`** and **`colorizeHelpText`** only (`help/run.ts`). See [help](./help).

Domain behavior stays in `packages/cli/src/core/**`. Table and rationale: [Command orchestration boundary — file layout](./orchestration#file-layout-inside-a-command-package).

| Command | Docs |
|---------|------|
| `init` | [init](./init) |
| `config` | [config](./config) |
| `validate` | [validate](./validate) |
| `missing` | [missing](./missing) |
| `sync` | [sync](./sync) |
| `generate` | [generate](./generate) |
| `fill` | [fill](./fill) |
| `quality` | [quality](./quality) |
| `review` | [review](./review) |
| `cleanup` | [cleanup](./cleanup) |
| `languages` | [languages](./languages) |
| `providers` | [providers](./providers) |
| `doctor` | [doctor](./doctor) |
| `help` | [help](./help) |
| `report` | [report](./report) |

**`locales`:** [list](./locales/list), [edit](./locales/edit), [dynamic](./locales/dynamic), [delete](./locales/delete).

Global **`--version`** / **`-v`**: [version](./version).

Subcommands use **full names only** (no short aliases like `gen` / `val`). Optional argv normalization: **`--langs`** as the first token is accepted as **`languages`**.

See also [CLI overview](../cli).
