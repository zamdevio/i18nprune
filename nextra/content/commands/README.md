# Commands

Each subcommand has a dedicated page. The CLI prints a **Documentation** link at the bottom of `help` output (see `src/constants/docs.ts`).

| Command | Docs |
|---------|------|
| `init` | [init](./init/README.md) |
| `config` | [config](./config/README.md) |
| `validate` | [validate](./validate/README.md) |
| `sync` | [sync](./sync/README.md) |
| `generate` | [generate](./generate/README.md) |
| `fill` | [fill](./fill/README.md) |
| `quality` | [quality](./quality/README.md) |
| `review` | [review](./review/README.md) |
| `cleanup` | [cleanup](./cleanup/README.md) |
| `languages` | [languages](./languages/README.md) |
| `doctor` | [doctor](./doctor/README.md) |
| `help` | [help](./help/README.md) |
| `report` | [report](./report/README.md) |

**`locales`:** [list](./locales/list/README.md), [edit](./locales/edit/README.md), [dynamic](./locales/dynamic/README.md), [delete](./locales/delete/README.md).

Global **`--version`** / **`-v`**: [version](./version/README.md).

Subcommands use **full names only** (no short aliases like `gen` / `val`). Optional argv normalization: **`--langs`** as the first token is accepted as **`languages`**.

See also [CLI overview](../cli/README.md).
