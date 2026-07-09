---
description: PR-style markdown audit summary for CI comments.
---

# `kits pr`

**PR / CI markdown** summary: counts plus dynamic site samples. Human-readable by default.

```bash
i18nprune kits pr
i18nprune kits pr --focus settings/index -T 10
i18nprune kits pr -j -o /tmp/i18n-pr.json
i18nprune kits pr -sb pr.md
```

## Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--focus` | `-f` | Filter dynamic samples by substring |
| `--save-baseline` | `-sb` | Save report to project-relative path |

Plus shared [`kits` flags](./README.md#shared-kits-flags) (`--target`, `--out`).

## JSON (`-j`)

Emits `kits-pr` with `summary`, `groups`, `sites`.

## See also

- [`kits honest`](./honest.md) — fuller combined audit
- [`kits` overview](./README.md)
