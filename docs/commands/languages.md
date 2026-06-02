# `languages` (`langs`)

Lists built-in language catalog entries used by `generate` and locale-source validation hints.

```bash
i18nprune languages
i18nprune langs --filter ja
i18nprune languages --json
```

`languages --json` returns catalog rows in the standard envelope with `code`, `english`, `native`, and `direction`. Useful jq patterns:

```bash
# Find RTL languages quickly
i18nprune languages --json | jq '.data[] | select(.direction == "rtl") | {code, english, native}'

# Count matches for a filter
i18nprune languages --filter ar --json | jq '.data | length'
```

Catalog source is generated into `packages/core/src/shared/languages/catalog/languages.json` via `pnpm generate:languages`.
