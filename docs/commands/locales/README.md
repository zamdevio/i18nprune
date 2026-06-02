# `locales`

Work with **existing locale JSON** under your configured **`localesDir`**. Subcommands support global **`--json`** (structured **`CliJsonEnvelope`** on stdout) when the root program passes **`--json`** — same contract as **`validate`**, **`generate`**, etc. See [JSON output](../../cli/json.md).

| Subcommand | Role |
|------------|------|
| **[`locales list`](./list.md)** | Enumerate locale JSON segments under **`localesDir`** (layout-aware), leaf counts, source-identical hints vs source. |
| **[`locales dynamic`](./dynamic.md)** | Read-only scan for non-literal translation call sites (same dynamic model as **`validate`**). |
| **[`locales delete`](./delete.md)** | Remove target locale JSON segment files (multi-target supported). |

Locale display metadata (`englishName`, `nativeName`, `direction`) belongs in **`src/i18n/config.json`** — use **`i18nprune patch`** to sync loader wiring. See [Locales config](../../config/locales.md).

```bash
i18nprune locales --help
i18nprune help locales list
```

## Global flags

Use root **`--json`** for machine output on supported subcommands; **`--yes`** skips interactive confirmations where documented (e.g. destructive **`delete`** in non-interactive mode).

## Nested help

```bash
i18nprune help locales list
i18nprune locales list --help
```

## See also

- [CLI overview](../../cli/README.md)
- [Issue codes](../../issues/README.md) — `i18nprune.locales.usage`, `i18nprune.locale.target_not_found`

## Examples

```bash
i18nprune locales list
i18nprune locales list --json | jq '.data.locales'
```

```bash
i18nprune locales dynamic --top 20
i18nprune locales delete --target ja --yes
```
