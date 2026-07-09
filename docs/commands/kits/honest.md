---
description: Combined validate, dynamic, quality, and review honest audit.
---

# `kits honest`

Combined **honest audit** signal: missing literal keys, dynamic sites, source-identical leaves, review metadata gaps. Default output is markdown.

```bash
i18nprune kits honest
i18nprune kits honest --focus settings/index -T 20 --strict
i18nprune kits honest -b .i18n-baseline.json -j
```

## Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--focus` | `-f` | Filter dynamic sites by substring |
| `--strict` | Exit 2 on missing keys or source-identical leaves |
| `--max-dynamic` | `-mxdy` | Policy cap on dynamic count |

Plus shared [`kits` flags](./README.md#shared-kits-flags).

## JSON (`-j`)

Emits `kits-honest` with `signal`, `dynamicGroups`, `focusedDynamicSites`, `baselineDelta`, `policy`.

## See also

- [`kits` overview](./README.md)
- [Dynamic key honesty](./README.md#dynamic-key-honesty)
