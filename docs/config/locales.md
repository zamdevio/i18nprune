---
description: Configure source locale code, locales directory, layout mode, and JSON file structure for your project.
---

# Locales config

Use the `locales` config block to control source locale code, locale directory, and layout mode/structure.

## Core fields

- `locales.source`: source locale language code (for example `en`)
- `locales.directory`: root directory that contains locale JSON
- `locales.mode`: `flat_file` or `locale_directory`
- `locales.structure`: required when `mode` is `locale_directory`

## Filesystem layouts

| Layout | `mode` | `structure` | Example |
|---|---|---|---|
| Flat files | `flat_file` (default) | `locale_file` (implicit) | `locales/en.json`, `locales/fr.json` |
| Per-locale folders | `locale_directory` | `locale_per_dir` | `messages/en/common.json`, `messages/fr/common.json` |
| Feature bundles | `locale_directory` | `feature_bundle` | `messages/auth/en.json`, `messages/maintenance/details/en.json` |

When `mode` is `locale_directory`, `structure` is required.

### Nested segments

Both `locale_per_dir` and `feature_bundle` walk nested folders under `locales.directory` up to depth **16** (`MAX_LOCALE_SEGMENT_TREE_DEPTH`).

| Structure | Nested example |
|---|---|
| `locale_per_dir` | `messages/en/pages/dashboard.json` |
| `feature_bundle` | `messages/maintenance/details/en.json`, `messages/maintenance/list/so.json` |

Generated multi-segment loaders **deep-merge** segment JSON (overlapping object layers keep all leaves). Same leaf path in two files: later segment wins. Sync / generate / cleanup already address each file by structural slot; nested feature paths swap only the locale basename (`…/details/en.json` → `…/details/so.json`).

## Schema-first behavior

Locale shape comes from key usage in source code scans, not from mirroring nested source JSON structure. `sync` and `generate` write only resolved paths and can prune stale paths based on command policy.

## Leaf metadata mode

Writer commands support two leaf modes:

- `legacy_string` (default)
- `structured` via `--metadata` for `sync`/`generate` (fields like `value`, `status`, `confidence`, `needsReview`, `source`)

`sync --strip-metadata` rolls structured leaves back to plain strings.

Config path:

```ts
export default {
  localeLeaves: {
    mode: 'legacy_string', // or 'structured'
    sync: {
      stripMetadata: false,
    },
  },
};
```

In structured mode, writer commands normalize and repair leaf objects (`value`, `status`, `confidence`, `needsReview`, `needsTranslationAgain`, `source`) rather than failing on partial/corrupt metadata.

## Related command docs

- [locales](../commands/locales/README.md)
- [sync](../commands/sync.md)
- [generate](../commands/generate.md)
