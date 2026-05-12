# `locales edit`

**Full examples:** [locales examples](../../../examples/commands/locales/README.md)

Updates **`<lang>.meta.json`** for an **existing** target locale (not the source locale): **`englishName`**, **`nativeName`**, and **`direction`** (`ltr` / `rtl`). It does **not** edit translation strings inside **`*.json`** locale bodies. Pass global **`--patch`** to also update supported app i18n loader wiring with the edited metadata.

**Precedence for defaults:** if **`<lang>.meta.json`** already exists and contains valid fields, those values are the baseline; otherwise values fall back to the bundled language **catalog**. Corrupt or partial meta sidecars are recoverable: `locales edit` rewrites them with the resolved values. User-project loader config is not read when a usable **`.meta.json`** exists for that code.

```bash
i18nprune locales edit --target ja
i18nprune locales edit --target ja,so
i18nprune locales edit --target all
i18nprune locales edit --target ar --english-name "Arabic" --native-name "العربية" --direction ltr
```

| Flag | Meaning |
|------|---------|
| **`--target <code[,code]\|all>`** | Existing target locale basename(s), comma-separated codes, or **`all`** for every non-source locale. Required when non-interactive or when global **`--yes`** is passed. |
| **`--english-name`** | Sets **`englishName`** in the meta file. |
| **`--native-name`** | Sets **`nativeName`** in the meta file. |
| **`--direction ltr\|rtl`** | Sets **`direction`**. |
| **Global `--patch`** | After the meta file write, updates supported patching config / generated loader files for the edited locale. |

Interactive TTY: omit **`--target`** to pick one locale from a list; pass multiple targets to edit each selected locale one by one. Omit name/direction flags to be prompted per target.

**Non-interactive** (`--json`, CI, no TTY, or global **`--yes`**): **`--target`** is required. Missing name/direction flags use existing **`.meta.json`** values or bundled catalog defaults without prompting. Invalid **`--direction`** values fail with **`i18nprune.locales.usage`** instead of silently falling back.

Unknown target codes in a multi-target selector are skipped and reported as **`i18nprune.locale.target_not_found`** warnings. If no editable target remains, the command fails with a usage issue.

## Auto-patching

`locales edit --patch` uses the same opt-in patching system as **`generate --patch`**, **`sync --patch`**, and **`locales delete --patch`**. For the current **`loader_generated`** recipe, the command rewrites the locale row in patching **`config.json`** and regenerates **`loaders.generated.ts`** so **`englishName`**, **`nativeName`**, and **`direction`** match the edited **`<lang>.meta.json`**.

If the patching block is incomplete, points at missing files, has invalid JSON, or is otherwise unsupported, the default **`warn_skip`** mode reports diagnostics and leaves the meta edit intact. See [Auto-patching](../../../patching/README.md).

## JSON mode

Global **`--json`** emits **`kind`: `locales-edit`** with **`targets[]`**, **`skippedTargets[]`**, **`updated`**, **`rows[]`** (`before` / `after`, **`metaPath`**, **`profileSource`**), and **`supportsAutoPatching: true`**. For single-target runs, legacy top-level **`target`**, **`before`**, **`after`**, **`metaPath`**, and **`profileSource`** are also populated. Missing or invalid **`--target`** yields **`ok: false`** and **`issues[]`** (e.g. **`i18nprune.locale.target_not_found`**, **`i18nprune.locales.usage`**).

[← Back to `locales`](../README.md)
