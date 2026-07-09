---
description: Signal snapshot with optional baseline delta comparison.
---

# `kits baseline`

Compact **signal snapshot**: missing literal keys, dynamic site count, source-identical leaves. Optionally compare against a prior JSON baseline (`-b`).

```bash
i18nprune kits baseline
i18nprune kits baseline -sb .i18n-baseline.md
i18nprune kits baseline -b .i18n-baseline.json -j
```

## Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--baseline` | `-b` | Load prior JSON signal for delta |
| `--save-baseline` | `-sb` | Save terminal-matching report |

Paths are relative to the **project root**.

## JSON (`-j`)

Emits `kits-baseline` with `signal`, optional `delta`, `issues`.

## See also

- [`kits` overview](./README.md)
