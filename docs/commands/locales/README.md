# `locales`

**Full examples:** [locales examples](../../examples/commands/locales/README.md)

Work with **existing locale JSON** under your configured **`localesDir`**. Subcommands support global **`--json`** (structured **`CliJsonEnvelope`** on stdout) when the root program passes **`--json`** — same contract as **`validate`**, **`generate`**, etc. See [JSON output](../../json/README.md).

| Subcommand | Role |
|------------|------|
| **[`locales list`](./list/README.md)** | Enumerate locale JSON segments under **`localesDir`** (layout-aware), leaf counts, source-identical hints vs source. |
| **[`locales dynamic`](./dynamic/README.md)** | Read-only scan for non-literal translation call sites (same dynamic model as **`validate`**). |
| **[`locales delete`](./delete/README.md)** | Remove target locale JSON segment files (multi-target supported). |

Locale display metadata (`englishName`, `nativeName`, `direction`) belongs in **`src/i18n/config.json`** — use **`i18nprune patch`** to sync loader wiring. See [Locale filesystem layouts](../../locales/layouts.md).

```bash
i18nprune locales --help
i18nprune help locales list
```

## Global flags

Use root **`--json`** for machine output on supported subcommands; **`--yes`** skips interactive confirmations where documented (e.g. destructive **`delete`** in non-interactive mode). See [Prompts & CLI boundaries](../../prompts/README.md).

## Nested help

```bash
i18nprune help locales list
i18nprune locales list --help
```

## See also

- [CLI overview](../../cli/README.md)
- [Issue codes](../../issues/README.md) — `i18nprune.locales.usage`, `i18nprune.locale.target_not_found`
