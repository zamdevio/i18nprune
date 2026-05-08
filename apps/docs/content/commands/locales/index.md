# `locales`

**Full examples:** [locales examples](../../examples/commands/locales)

Work with **existing locale JSON** under your configured **`localesDir`**. Subcommands support global **`--json`** (structured **`CliJsonEnvelope`** on stdout) when the root program passes **`--json`** — same contract as **`validate`**, **`generate`**, **`fill`**, etc. See [JSON output](../../json).

| Subcommand | Role |
|------------|------|
| **[`locales list`](./list)** | Enumerate `*.json` under **`localesDir`**, leaf counts, English-identical hints vs source. |
| **[`locales edit`](./edit)** | Update **`<lang>.meta.json`** (`englishName`, `nativeName`, `direction`) for an existing target locale. |
| **[`locales dynamic`](./dynamic)** | Read-only scan for non-literal translation call sites (same dynamic model as **`validate`**). |
| **[`locales delete`](./delete)** | Remove target **`*.json`** / **`*.meta.json`** (multi-target supported). |

```bash
i18nprune locales --help
i18nprune help locales list
```

## Global flags

Use root **`--json`** for machine output on supported subcommands; **`--yes`** skips interactive confirmations where documented (e.g. destructive **`delete`** in non-interactive mode). See [Prompts & CLI boundaries](../../prompts).

## Nested help

```bash
i18nprune help locales list
i18nprune locales list --help
```

## See also

- [CLI overview](../../cli)
- [Issue codes](../../issues) — `i18nprune.locales.usage`, `i18nprune.locale.target_not_found`
