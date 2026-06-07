---
description: Regex-based extraction rules, per-file const maps, and conservative limits vs full TypeScript semantics.
---

# Regex and static-analysis limits

i18nprune extraction is pattern-based and intentionally conservative. It is not a full TypeScript semantic compiler pass.

## Practical limits

- Indirect helper calls and runtime-only key construction may not be fully resolved.
- Per-file constant reconstruction works best for simple local constants.
- Framework-specific syntax can reduce accuracy if call shapes are unusual.

## See also

- [Extraction architecture](./README.md)
- [validate](../../commands/validate.md)
- [locales dynamic](../../commands/locales/dynamic.md)
