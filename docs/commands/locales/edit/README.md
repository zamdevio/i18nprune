# `locales edit`

**Full examples:** [locales examples](../../../examples/commands/locales/README.md)

Updates **`<lang>.meta.json`** for an **existing** target locale (not the source locale): **`englishName`**, **`nativeName`**, and **`direction`** (`ltr` / `rtl`). It does **not** edit translation strings inside **`*.json`** locale bodies; loader auto-patching is tracked separately (see [ADR 004](../../../architecture/decisions/004-auto-patch.md)).

**Precedence for defaults:** if **`<lang>.meta.json`** already exists and contains valid fields, those values are the baseline; otherwise values fall back to the bundled language **catalog**. User-project loader config is not read when a usable **`.meta.json`** exists for that code.

```bash
i18nprune locales edit --target ja
i18nprune locales edit --target ar --english-name "Arabic" --native-name "العربية" --direction ltr
```

| Flag | Meaning |
|------|---------|
| **`--target <code>`** | Basename of an existing **`locales/<code>.json`** (required when non-interactive). |
| **`--english-name`** | Sets **`englishName`** in the meta file. |
| **`--native-name`** | Sets **`nativeName`** in the meta file. |
| **`--direction ltr\|rtl`** | Sets **`direction`**. |

Interactive TTY: omit **`--target`** to pick a locale from a list; omit name/direction flags to be prompted.

**Non-interactive** (`--json`, CI, no TTY): **`--target`** is required; optional flags set fields without prompts.

## JSON mode

Global **`--json`** emits **`kind`: `locales-edit`** with **`before` / `after`**, **`metaPath`**, **`profileSource`** (`meta` vs `catalog`). Missing or invalid **`--target`** yields **`ok: false`** and **`issues[]`** (e.g. **`i18nprune.locale.target_not_found`**, **`i18nprune.locales.usage`**).

[← Back to `locales`](../README.md)
