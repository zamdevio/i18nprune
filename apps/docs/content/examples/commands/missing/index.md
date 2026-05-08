# Missing Examples

## Preview

```bash
i18nprune missing --dry-run
i18nprune missing --dry-run --top 20
```

## Write placeholders

```bash
i18nprune missing --locale ja --yes
```

## Timing

```bash
time i18nprune missing --dry-run --json | jq '.data.paths | length'
```

## Global flag coverage

```bash
# compact JSON + explicit config path
i18nprune -c i18nprune.config.ts --json missing --dry-run --json-pretty false | jq '.data.paths[:10]'

# persist machine output for missing pass
i18nprune --config i18nprune.config.ts --json missing --dry-run > ./out/missing-run.json

# write mode in non-interactive sessions
i18nprune --config i18nprune.config.ts --yes missing --locale ja
```
