---
description: Report source-identical leaf paths per locale file.
---

# `kits identical`

Reports locale leaves whose **value equals the source locale** at the same path. Applies `policies.parity` excludes unless `--raw`.

```bash
i18nprune kits identical
i18nprune kits identical -T 50 --raw
i18nprune kits identical --strict -j
```

## Flags

| Flag | Description |
|------|-------------|
| `--raw` | `-r` — disable parity excludes |
| `--strict` | Exit 2 when any source-identical leaves exist |
| `--fail-on` | `-fon` — policy gates (strict adds `source-identical`) |

Plus shared [`kits` flags](./README.md#shared-kits-flags).

## JSON (`-j`)

Emits `kits-identical`: `totalSourceIdentical`, `locales[]` with `identicalPaths`, `policy`.

## See also

- [`quality`](../quality.md) — SDK parity metrics
- [`kits` overview](./README.md)
