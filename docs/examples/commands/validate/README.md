# Validate Examples

## Human + JSON

```bash
i18nprune validate
i18nprune validate --json | jq '{ok, missing: (.data.missing|length), dynamic: .data.dynamic.count}'
```

## CI gate

```bash
i18nprune validate --json | jq -e '.ok'
```

## Timing

```bash
time i18nprune validate --json | jq '.meta.apiVersion'
```

## Global flag coverage

```bash
# explicit config + compact JSON
i18nprune -c i18nprune.config.ts --json validate --json-pretty false

# override scanner-related globals
i18nprune --source locales/en.json --src src --functions t,i18n.t validate --json | jq '{ok, dynamic: .data.dynamic.count}'
```

See also: [jq cookbook](../../jq-cookbook/README.md)
