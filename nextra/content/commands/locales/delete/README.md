# `locales delete`

Deletes a **target** locale file **`<lang>.json`** under **`localesDir`**, and **`<lang>.meta.json`** when it exists. The **source** locale file cannot be deleted (same rule as **`fill`** / **`generate`**).

## Safety

- **Interactive:** Confirmation prompt unless **global `--yes`**.
- **Non-interactive:** **Requires global `--yes`** or the command errors.

## Future

**Auto-patching** of app i18n loader wiring when a registered pattern is detected is planned (see [Roadmap](../../roadmap/README.md)); today only the JSON files are removed.

## Usage

```bash
i18nprune locales delete --lang ja
```

## See also

- [`locales`](../README.md)
