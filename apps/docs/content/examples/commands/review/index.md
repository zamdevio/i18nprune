# Review Examples

## Human + JSON

```bash
i18nprune review
i18nprune --json review | jq '.data.locales | keys'
```

## Scope targets

```bash
i18nprune review --target ja,ar
i18nprune --json review --target ja | jq '.data.locales["ja.json"]'
```

## Metadata gap summary

```bash
i18nprune --json review | jq '.data.locales
  | to_entries
  | map({file: .key, missingNeedsReview: .value.structuredLeavesMissingNeedsReview, missingConfidence: .value.structuredLeavesMissingConfidence})'
```

## Global flag coverage

```bash
# compact JSON envelope
i18nprune -c i18nprune.config.ts --json review --target ja --json-pretty false

# review run artifact
i18nprune --config i18nprune.config.ts stdout redirection ./out/review-run.csv --format csv review --target ja
```
