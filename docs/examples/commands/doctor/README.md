# Doctor Examples

## Full + scoped checks

```bash
i18nprune doctor
i18nprune doctor --only runtime,tools
```

## JSON finding table

```bash
i18nprune doctor --json | jq '.data.findings[] | {id, severity, title}'
```

## Strict mode gate

```bash
i18nprune doctor --strict --json | jq -e '.ok'
```

## Global flag coverage

```bash
# compact JSON diagnostics
i18nprune -c i18nprune.config.ts --json doctor --only runtime,tools --json-pretty false

# write run artifact
i18nprune --config i18nprune.config.ts stdout redirection ./out/doctor-run.json --format json doctor --strict
```
