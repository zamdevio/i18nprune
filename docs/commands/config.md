# `config`

Prints resolved **config**, **paths**, and **`I18NPRUNE_*`** env snapshot.

```bash
i18nprune config
i18nprune --json config
```

**`--json`** emits **`kind: i18nprune.config`**. Works without creating a new config file (read-only).

## JSON shape notes

- **`fieldSources`** — **where each config field’s value came from** in the merge stack (`default` | `file` | `env` | `discovery` | `cli`). Here **`file`** means “loaded from the **config module** on disk”, **not** “this path is a filesystem file”.
- **`resolvedPathKinds`** — **filesystem role** of each entry in **`resolvedPaths`**: `file` (e.g. source locale JSON), `directory` (e.g. `localesDir`, `srcRoot`), or `missing` if the path does not exist.

## Examples

```bash
i18nprune config
i18nprune config --json | jq '.data.resolvedPaths'
```

```bash
# inspect merge sources
i18nprune config --json | jq '.data.fieldSources'
```
