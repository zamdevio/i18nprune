---
description: Regex-based extraction rules, per-file const maps, and conservative limits vs full TypeScript semantics.
---

# Regex and static-analysis limits

i18nprune extraction is pattern-based and intentionally conservative. It is not a full TypeScript semantic compiler pass.

## Practical limits

- Indirect helper calls and runtime-only key construction may not be fully resolved.
- Per-file constant reconstruction works best for simple local constants.
- Framework-specific syntax can reduce accuracy if call shapes are unusual.

## Hooks, aliases, and props

- Hook presets (`useTranslation` / `useTranslations`) and same-file one-hop aliases (`const tt = t`) expand helpers on the default path.
- **Prop-only components** (`function Row({ t }) { t('…') }` with no hook/import in that file) are **off by default**. They matter when `functions` lists hooks but not bare `t` — full config, when-to-enable, and init notes: [Extractor config](../../config/extractor.md).

## See also

- [Extractor config](../../config/extractor.md)
- [Extraction architecture](./README.md)
- [validate](../../commands/validate.md)
- [locales dynamic](../../commands/locales/dynamic.md)
