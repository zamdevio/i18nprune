# Locale filesystem layouts

i18nprune reads and writes locale JSON using **`locales.source`** (source locale **language code**, e.g. `en`), **`locales.directory`**, **`locales.mode`**, and **`locales.structure`**. The CLI, web upload, and worker all use the same enumeration rules from **`@i18nprune/core`**.

**`locales.source` must be a language code only** (not `en.json` and not `messages/en/app.json`). Invalid values fail config load and project readiness; unknown codes get the same catalog hints as **`i18nprune generate`** (run **`i18nprune languages`** for the full list). For **`locale_per_dir`** / **`feature_bundle`**, readiness **warns** when the source locale is missing segment files that other locales already have under **`locales.directory`**.

## Quick reference

| Layout | `mode` | `structure` | On-disk example |
|--------|--------|-------------|-----------------|
| Flat files (default) | `flat_file` (optional) | `locale_file` (implicit) | `locales/en.json`, `locales/fr.json` |
| Per-locale folders | `locale_directory` | `locale_per_dir` | `messages/en/common.json`, `messages/fr/auth.json` |
| Feature bundles | `locale_directory` | `feature_bundle` | `messages/auth/en.json`, `messages/auth/fr.json` |

**Rule:** When **`mode`** is **`locale_directory`**, you **must** set **`structure`** to **`locale_per_dir`** or **`feature_bundle`**. Readiness fails with **`i18nprune.project.locales_structure_required`** if it is omitted (layout is not guessed).

## Flat file + locale file

Typical for small apps and many starter templates.

```ts
export default {
  locales: {
    source: 'en',
    directory: 'locales',
    // mode: 'flat_file' — default
    // structure: 'locale_file' — default when mode is flat_file
  },
  src: 'src',
  functions: ['t'],
};
```

```
locales/
  en.json    ← source
  fr.json
  de.json
```

**Fixture:** `tests/fixtures/layout-flat-file` (minimal). `tests/fixtures/sample-i18n` also uses this layout for parity and broader CLI drills.

## Locale directory + locale per dir

One directory per locale code; multiple JSON segment files inside each (i18next-style trees).

```ts
export default {
  locales: {
    source: 'en',
    directory: 'messages',
    mode: 'locale_directory',
    structure: 'locale_per_dir',
  },
  src: 'src',
  functions: ['t'],
};
```

```
messages/
  en/
    common.json   ← often the source segment
    auth.json
  fr/
    common.json
    auth.json
```

**Fixture:** `tests/fixtures/layout-locale-per-dir`.

## Locale directory + feature bundle

Feature (namespace) folders; locale code is the **basename** of each JSON file.

```ts
export default {
  locales: {
    source: 'en',
    directory: 'messages',
    mode: 'locale_directory',
    structure: 'feature_bundle',
  },
  src: 'src',
  functions: ['t'],
};
```

```
messages/
  auth/
    en.json   ← source
    fr.json
  common/
    en.json
    fr.json
```

**Fixture:** `tests/fixtures/layout-feature-bundle`.

## Locale metadata (display names, direction)

Locale **display metadata** (`englishName`, `nativeName`, `direction`) for app loaders lives in **`src/i18n/config.json`** and generated loader modules — not in **`<lang>.meta.json`** sidecars (the tool does not create those files). Any **`*.meta.json`** already on disk is a normal **`*.json`** file under the active layout rules. Use **`i18nprune patch`** (or **`generate --patch`**) to keep loader wiring aligned when locales change.

## Init and detection

**`i18nprune init`** can emit **`mode`** and **`structure`** when disk layout is unambiguous. If you set **`locale_directory`** by hand, always pair it with the correct **`structure`**.

## Related

- [Configuration](../config/README.md)
- [Project readiness issues](../issues/project.md#locales_structure_required)
- [Locales overview](./README.md)
