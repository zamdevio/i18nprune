# `review`

Summary-only locale audit versus source locale values and structured-leaf review metadata.

```bash
i18nprune review
i18nprune --json review
```

## Scope

Use `--target` to limit review to selected locale files.

## Related

- [validate](./validate.md)
- [quality](./quality.md)
- [report](./report.md)

## jq usage (`--json`)

`review --json` emits `ReviewJsonData` in `data`:

- `kind: "localeReview"`
- `sourceLocale`, `localesDir`
- `dynamicKeySites`
- `locales` object keyed by locale code with review counters

```bash
# Show locales with highest needsReview=true counts
i18nprune review --json \
  | jq '.data.locales | to_entries | map({locale: .key, needsReviewTrue: .value.needsReviewTrue}) | sort_by(-.needsReviewTrue)'
```

See also the [jq cookbook](../examples/jq-cookbook.md).
