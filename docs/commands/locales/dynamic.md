# `locales dynamic`

Read-only scan for non-literal translation call sites, using the same heuristic model as `validate`.

```bash
i18nprune locales dynamic
i18nprune locales dynamic --json --top 50
```

## Flags

- `--top <n>`
- `--full`

## See also

- [`locales`](./README.md)
- [`validate`](../validate.md)
- [Dynamic key handling](../../architecture/extraction/dynamic.md)
