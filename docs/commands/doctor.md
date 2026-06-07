---
description: Read-only diagnostics for runtime, tools, config, and path readiness.
---

# `doctor`

Read-only diagnostics for runtime, tools, config, and path readiness.

```bash
i18nprune doctor
i18nprune doctor --only runtime,tools
i18nprune --json doctor --strict
```

`--strict` treats warnings as failures.

## jq usage (`--json`)

`doctor --json` emits `DoctorJsonPayload` in `data`:

- `kind: "doctor"`
- `strict`
- `findings[]` (check id, severity, message, remediation info)

```bash
# Fail CI on any error finding
i18nprune doctor --json | jq -e '[.data.findings[] | select(.severity == "error")] | length == 0'

# Print compact finding list
i18nprune doctor --json | jq '.data.findings[] | {check: .checkId, severity, message}'
```

For shared filters, see the [jq cookbook](../examples/jq-cookbook.md).
