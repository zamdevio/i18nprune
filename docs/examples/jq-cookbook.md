# jq cookbook

Practical `jq` filters for i18nprune JSON envelopes, focused on efficient command summaries across validate, sync, generate, review, and more.

## Quick setup

```bash
jq -V
```

## Validate summary

```bash
i18nprune validate --json \
| jq '{ok, missing: (.data.missing | length), dynamic: .data.dynamic.count, issueCodes: [.issues[].code]}'
```

## Sync metadata histogram

```bash
i18nprune --json sync --target ja --dry-run --metadata \
| jq '.data.localeMetadataReports["ja.json"].leafDecisions
      | group_by(.action)
      | map({action: .[0].action, count: length})'
```

## Generate target summary

```bash
i18nprune --json generate --target ja,de --dry-run --metadata \
| jq '.data.targetResults
      | map({target, mode: .localeMetadata.mode, repaired: .localeMetadata.repairedCorruptLeaves})'
```

## Review issues table

```bash
i18nprune --json review | jq '.issues | map({severity, code, message})'
```

## Notes

- Prefer grouped/sliced output (`group_by`, `[:N]`) for large payloads.
- Pair these with `stdout redirection` when you need archived artifacts.
- Expand this cookbook later as command payload docs stabilize.
