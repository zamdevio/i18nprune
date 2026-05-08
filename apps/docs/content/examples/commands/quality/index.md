# Quality Examples

## Project + one locale

```bash
i18nprune quality
i18nprune quality --target ja
```

## JSON shaping

```bash
i18nprune --json quality | jq '.data'
```

## Timing

```bash
time i18nprune --json quality | jq '.meta.apiVersion'
```

## Global flag coverage

```bash
# explicit config + compact JSON
i18nprune -c i18nprune.config.ts --json quality --target ja --json-pretty false

# persist quality run summary artifact
i18nprune --config i18nprune.config.ts stdout redirection ./out/quality-run.txt --format text quality --target ja
```
