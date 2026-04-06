# `locales edit`

Edits **existing** `<lang>.json` files and (when implemented) your **application’s** i18n loader wiring using **fixed patterns** the tool understands.

> **Note:** Does not manage **`i18nprune.config.*`** — that file only configures how this CLI runs.

- Pass **`--lang <code>`** so it matches a **`*.json`** basename under **`localesDir`** (excluding **`*.meta.json`**).
- Omit **`--lang`** in a TTY to pick from the list interactively.
- In CI / non-interactive mode, **`--lang` is required**.

```bash
i18nprune locales edit --lang ja
i18nprune locales edit
```

[← Back to `locales`](../README.md)
