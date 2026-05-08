# Config Examples

## Inspect effective config

```bash
i18nprune config
i18nprune config --json | jq '.data.resolvedPaths'
```

## Field-source tracing

```bash
i18nprune config --json | jq '.data.fieldSources'
```

## Timing

```bash
time i18nprune config --json | jq '.data.envSnapshot'
```

## Global flag coverage

```bash
# explicit config file + compact JSON
i18nprune -c i18nprune.config.ts --json config --json-pretty false

# config command run artifact
i18nprune --config i18nprune.config.ts stdout redirection ./out/config-run.json --format json config
```
