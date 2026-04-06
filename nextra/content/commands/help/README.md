# `help`

Shows global usage or per-command help.

```bash
i18nprune help
i18nprune help generate
i18nprune validate --help
```

Help output is styled in **`src/commands/help/index.ts`** (colors + docs footer via `src/constants/docs.ts`). Every **`--help`** / **`help <topic>`** prepends the same box style: title from **`toolDisplayTitle`** (e.g. **`I18nprune`**, **`Languages`**, **`Locales List`**), subtitle from **`getTopicBannerSubtitle`** in **`src/utils/cli/banner.ts`**. Suppressed when global **`--json`** or **silent**.

## Nested help

```bash
i18nprune locales help edit
i18nprune locales list --help
```