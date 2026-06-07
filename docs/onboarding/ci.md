---
description: Run validate --json in CI, gate on ok and exit codes, and keep jobs non-interactive with global flags.
---

# CI onboarding path

## Gate with `validate --json`
In CI, use `validate` in machine-readable mode and fail the job when the result is not OK.

```bash
i18nprune validate --json | jq -e '.ok'
```

`--json` is built for automation: it keeps a stable envelope and includes `issues[]` rows when there are problems to fix.

## Stable issue codes
When CI fails, you should be able to route the failure to the right docs section.

See: [Issues reference](../issues/README.md).

## Parity expectations (keep human and JSON aligned)
This repository aims to keep CLI human output and JSON output aligned.

See: [Parity checklist](../release/parity-checklist/README.md).

## Debug quickly with jq
If you want more context while still keeping the pipeline fail-fast:

```bash
i18nprune validate --json | jq '{ok, missing: (.data.missing | length), dynamic: .data.dynamic.count}'
```

For reusable jq patterns:
- [jq cookbook](../examples/jq-cookbook.md)

## What to read next
- [CLI path](./cli.md)
- [Commands: validate](../commands/validate.md)
- [JSON output contract](../cli/json.md)
