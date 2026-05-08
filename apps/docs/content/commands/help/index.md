# `help`

**Full examples index:** [command examples](../../examples/commands)

Shows global usage or per-command help.

```bash
i18nprune help
i18nprune help generate
i18nprune validate --help
```

Implementation: **`packages/cli/src/commands/help/run.ts`** ( **`configureCliHelp`**, **`colorizeHelpText`** ); **`index.ts`** re-exports only. There is intentionally no **`help()`** function — this stays stable for exports and Commander wiring. Colors + docs footer use **`getDocsUrl` / `docsCommandUrl`** from **`@i18nprune/core`**. Every **`--help`** / **`help <topic>`** prepends the same box style: title from **`toolDisplayTitle`**, subtitle from **`getTopicBannerSubtitle`** in **`packages/cli/src/utils/cli/banner.js`**. Suppressed when global **`--json`** or **silent**.

## Nested help

```bash
i18nprune locales help edit
i18nprune locales list --help
```