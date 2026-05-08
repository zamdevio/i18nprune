# Cleanup Examples

## Safe audits

```bash
i18nprune cleanup --check-only
i18nprune cleanup --json | jq '.data | {targets, wouldRemove: (.unused | length)}'
```

## Apply removals

```bash
i18nprune cleanup --yes
```

## Ask flow (TTY)

```bash
i18nprune cleanup --ask
i18nprune cleanup --ask --ask-per-key
```

## Timing

```bash
time i18nprune cleanup --check-only --json | jq '.issues | length'
```

## Global flag coverage

```bash
# compact JSON audit output
i18nprune -c i18nprune.config.ts --json cleanup --check-only --json-pretty false

# run artifact for change review
i18nprune --config i18nprune.config.ts stdout redirection ./out/cleanup-run.csv --format csv cleanup --check-only

# explicit non-interactive destructive run
i18nprune --config i18nprune.config.ts --yes cleanup
```
