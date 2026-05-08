# Start in 60 seconds

The goal of this page is one fast win: verify your project and get a machine-readable result in under a minute.

## 1) Run without writing

```bash
i18nprune validate --json | jq '{ok, missing: (.data.missing | length), dynamic: .data.dynamic.count}'
```

If `ok` is `true`, your source usage and source locale shape are currently aligned.

## 2) Preview locale alignment

```bash
i18nprune sync --dry-run --json | jq '.data.files[] | {path, changed}'
```

This simulates locale-file shape alignment without changing disk.

## 3) Optional next action

If preview output looks correct:

```bash
i18nprune sync --yes
```

## 4) Keep this in CI

```bash
i18nprune validate --json | jq -e '.ok'
```

This fails the job when validation is not OK.

## What to read next

- [Commands](../commands)
- [Examples index](../examples)
- [jq cookbook](../examples/jq-cookbook)
- [JSON output contract](../json)
