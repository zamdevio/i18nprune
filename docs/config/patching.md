---
description: Patching block controls opt-in loader and i18n config updates alongside locale file mutations.
---

# Patching config

Use the `patching` block when you want loader/config patch operations to run with locale mutations.

## Core fields

- `patching.enabled`
- `patching.recipe` (current primary recipe: `loader_generated`)
- `patching.configPath`
- `patching.loaderPath`
- `patching.mode` (`warn_skip` or `strict`)
- `patching.sizeLimitBytes`
- `patching.localeJsonImportBase`

## Related command docs

- [patching overview](../patching/README.md)
- [patching config reference](../patching/config.md)
- [`init`](../commands/init.md)
