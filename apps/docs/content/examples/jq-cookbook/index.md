# jq Cookbook for i18nprune JSON

Practical filters to turn raw `--json` envelopes into readable summaries.

## Quick setup

```bash
# ensure jq exists
jq --version
```

Most commands below assume output is a single envelope on stdout.

## 1) Validate: missing + dynamic counts

```bash
i18nprune validate --json \
| jq '{ok, missing: (.data.missing | length), dynamic: .data.dynamic.count, issueCodes: [.issues[].code]}'
```

## 2) Sync: metadata action histogram (per locale file)

```bash
i18nprune --json sync --target ja --dry-run --metadata \
| jq '.data.localeMetadataReports["ja.json"].leafDecisions
      | group_by(.action)
      | map({action: .[0].action, count: length})'
```

## 3) Sync: inspect conflict precedence (`--metadata` + `--strip-metadata`)

```bash
i18nprune --json sync --target ja --dry-run --metadata --strip-metadata \
| jq '{mode: .data.localeMetadataReports["ja.json"].mode, issues: [.issues[].code]}'
```

Expected `mode` is `legacy_string`; issues include `i18nprune.sync.metadata_flag_conflict`.

## 4) Generate: per-target metadata summary

```bash
i18nprune --json generate --target ja,de --dry-run --metadata \
| jq '.data.targetResults
      | map({
          target,
          mode: .localeMetadata.mode,
          promotedLegacyLeaves: .localeMetadata.promotedLegacyLeaves,
          repairedCorruptLeaves: .localeMetadata.repairedCorruptLeaves
        })'
```

## 5) Fill: only show repair decisions

```bash
i18nprune --json fill --target ja --dry-run --metadata \
| jq '.data.targetResults[0].localeMetadata.leafDecisions
      | map(select(.action == "repaired_corrupt"))
      | .[:25]'
```

## 6) Extract issue table for CI logs

```bash
i18nprune --json review \
| jq '.issues | map({severity, code, message})'
```

## 7) Time command + capture compact summary

```bash
time i18nprune --json sync --target ja --dry-run --metadata \
| jq '{ok, files: .data.targetFiles, changed: (.data.files | map(select(.changed==true)) | length)}'
```

## Notes

- `jq` snippets are stable when keys are documented in command payload types.
- For large `leafDecisions`, prefer slicing (`[:N]`) or grouping to keep output manageable.
- Pair these snippets with `stdout redirection` when you need archived artifacts.
