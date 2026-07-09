---
description: List dynamic translation key call sites (read-only).
---

# `kits dynamic`

Lists **non-literal** translation call sites (template literals, variables, etc.). Read-only — uses `runDynamic`.

```bash
i18nprune kits dynamic
i18nprune kits dynamic --contains settings -T 50
i18nprune kits dynamic -fon dynamic -mxdy 80 -j
```

## Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--contains` | `-cn` | Filter sites by substring in file path or preview |
| `--fail-on` | `-fon` | Comma-separated policy gates |
| `--max-dynamic` | `-mxdy` | Exit 2 when count exceeds *n* |
| `--baseline` | `-b` | Compare against saved JSON baseline |
| `--save-baseline` | `-sb` | Save report (`.md` or `.json` with `-j`) |

Plus shared [`kits` flags](./README.md#shared-kits-flags).

## JSON (`-j`)

Emits a standard `CliJsonEnvelope` with `data.kind: kits-dynamic`. Pretty by default with `-j`; use `-jp false` for minified output.

```bash
i18nprune kits dynamic -j | jq '.counts.total'
```

## See also

- [`kits` overview](./README.md)
- [Dynamic keys](../../dynamic/README.md)
