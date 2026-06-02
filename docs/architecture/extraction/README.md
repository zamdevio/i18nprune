# Extraction architecture

This section explains how i18nprune finds translation usage from source text and where the limits are.

Keep command behavior in command docs (`validate`, `locales dynamic`, `missing`), and keep extraction internals here.

## Pages

- [Dynamic key handling](./dynamic.md)
- [Regex and static-analysis limits](./regex.md)

## Primary command links

- [validate](../../commands/validate.md)
- [locales dynamic](../../commands/locales/dynamic.md)
- [cleanup](../../commands/cleanup.md)

## Adoption barriers moved here

Historical "barriers" docs are consolidated into extraction architecture:

- dynamic/non-literal key limits and mitigation -> [dynamic](./dynamic.md)
- regex/static analysis limits -> [regex](./regex.md)
- CI-safe non-interactive behavior -> command pages and [CLI JSON behavior](../../cli/json.md)
