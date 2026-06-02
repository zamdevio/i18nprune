# jq cookbook

Practical `jq` filters for i18nprune JSON envelopes.

Use this page when you need CI-safe summaries, issue extraction, or compact machine-readable reports.

## Quick setup

```bash
jq -V
```

## Envelope sanity check (all commands)

```bash
i18nprune validate --json \
| jq '{ok, kind, issueCount: (.issues | length), apiVersion: .meta.apiVersion}'
```

## Validate: missing + dynamic + issue codes

```bash
i18nprune validate --json \
| jq '{
    ok,
    missing: (.data.missing | length),
    dynamic: (.data.dynamic.count // 0),
    issueCodes: [.issues[].code]
  }'
```

## Validate: fail CI when missing keys exist

```bash
i18nprune validate --json \
| jq -e '.ok and ((.data.missing | length) == 0)'
```

## Sync: metadata action histogram (per locale)

```bash
i18nprune sync --json --target ja --dry-run --metadata \
| jq '.data.localeMetadataReports["ja.json"].leafDecisions
      | group_by(.action)
      | map({action: .[0].action, count: length})'
```

## Generate: per-target status summary

```bash
i18nprune generate --json --target ja,de --dry-run --metadata \
| jq '.data.targetResults
      | map({
          target,
          status,
          partial,
          fallbackCount: (.fallbackCount // 0),
          repairedLeaves: (.localeMetadata.repairedCorruptLeaves // 0)
        })'
```

## Generate: list failed targets only

```bash
i18nprune generate --json --target ja,de \
| jq '.data.targetResults[]
      | select(.status != "ok")
      | {target, status, error: (.error // null)}'
```

## Review/quality: normalize issues table

```bash
i18nprune review --json \
| jq '.issues | map({severity, code, message, docHref: (.docHref // null)})'
```

## Doctor: compact readiness summary

```bash
i18nprune doctor --json \
| jq '{ok, issueCount: (.issues | length), issues: [.issues[].code]}'
```

## Share: list local cache rows (JSON mode)

```bash
i18nprune share list --json \
| jq '.data.entries
      | map({
          kind,
          id,
          uploadedAt,
          expiresAt: (.remote.expiresAt // null)
        })'
```

## Report: extract headline counts

```bash
i18nprune report --json \
| jq '{
    ok,
    kind,
    issueCount: (.issues | length),
    documentKind: (.data.document.kind // null)
  }'
```

## Useful jq patterns

- Use `//` for optional fields: `.foo // 0`
- Use `-e` for CI predicates that must return success/failure
- Use `map(...)` for stable row projection
- Use `group_by(...)` + `length` for quick histograms

## Related docs

- [JSON output (`--json`)](../cli/json.md)
- [Examples hub](./README.md)
