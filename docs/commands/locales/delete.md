# `locales delete`

Deletes target locale files under `localesDir` (and matching `.meta.json` files when present). Source locale cannot be deleted.

```bash
i18nprune locales delete --target ja --yes
i18nprune locales delete --target all --yes
```

## JSON mode

Global `--json` emits `kind: locales-delete` with deletion results.

## See also

- [`locales`](./README.md)
- [Issue codes](../../issues/README.md)
