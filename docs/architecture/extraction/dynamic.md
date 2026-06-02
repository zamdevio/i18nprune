# Dynamic key handling

Dynamic keys are translation calls where the first argument is not a static string literal.

## Why this is a hard boundary

Static analysis cannot safely resolve runtime expressions like `t(user.role + ".label")` or ``t(`prefix.${id}`)``. Guessing these keys would create false deletions and broken locale files.

## What i18nprune does

- Detects and reports dynamic call sites.
- Preserves dynamic reporting as warnings (not direct validate failures).
- Reuses per-file const-map where safe so rebuildable template keys are treated as static keys.
- Surfaces dynamic counts in command JSON payloads for CI visibility.

## Operational guidance

- Prefer literal keys for high-confidence validate/sync/cleanup behavior.
- Use dynamic reports as an audit checklist.
- In CI/non-interactive mode, dynamic sites are emitted as data (no prompts).

## Where to use this

- [validate](../../commands/validate.md)
- [locales dynamic](../../commands/locales/dynamic.md)
- [Extraction architecture](./README.md)
