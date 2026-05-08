# `locales list`

**Full examples:** [locales examples](../../../examples/commands/locales/README.md)

Lists **`*.json`** locale files under **`localesDir`** (excluding **`*.meta.json`**), with per-file **string leaf counts** and, for non-source locales, a count of leaves whose value still **matches the source** at the same path (source-identical / parity hint). Fails fast if **`localesDir`** is missing or not a directory.

```bash
i18nprune locales list
i18nprune locales list --json
```

## JSON mode

With global **`--json`**, stdout is a single **`CliJsonEnvelope`** (`kind`: **`locales-list`**) including **`sourceLocalePath`**, **`rows[]`** per locale file, and aggregate counts. Typed payload: `packages/cli/src/types/command/locales/json.ts`.

[← Back to `locales`](../README.md)
