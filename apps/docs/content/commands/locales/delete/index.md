# `locales delete`

**Full examples:** [locales examples](../../../examples/commands/locales)

Deletes target locale files **`<code>.json`** under **`localesDir`**, and **`<code>.meta.json`** when present. The **source** locale cannot be deleted (same rule as **`fill`** / **`generate`**).

```bash
i18nprune locales delete --target ja
i18nprune locales delete --target ja,de --yes
i18nprune locales delete --target all --yes
i18nprune locales delete
```

| Flag | Meaning |
|------|---------|
| **`--target <codes>`** | One code, comma-separated codes, or **`all`** (non-source locales). Omit in a TTY to pick interactively. |
| **`--ask`** | Extra confirmation step in interactive mode (after the main delete confirm). |
| **Global `--yes`** | Skips confirmation; **required** for non-interactive runs (including **`--json`**). |

## JSON mode

Global **`--json`** prints **`kind`: `locales-delete`** with **`targets[]`**, **`deletedJson`**, **`deletedMeta`**, **`aborted`**. No interactive prompts on stdin when **`--json`** is set; use **`--yes`** for destructive runs.

**Future:** auto-patching of app i18n loader wiring when a pattern is registered — payload may grow; see [Roadmap](../../../roadmap).

## See also

- [`locales`](..)
- [Issue codes](../../../issues)
