# Languages Examples

## Human + JSON

```bash
i18nprune languages
i18nprune languages --json | jq '.data.languages[:20]'
```

## Search catalog

```bash
i18nprune languages --json | jq '.data.languages[] | select(.code == "ja" or .code == "ar")'
```

## Timing

```bash
time i18nprune languages --json | jq '.data.languages | length'
```

## Global flag coverage

```bash
# explicit config + compact JSON output
i18nprune -c i18nprune.config.ts --json languages --json-pretty false

# languages run artifact
i18nprune --config i18nprune.config.ts stdout redirection ./out/languages-run.json --format json languages --filter ja
```
