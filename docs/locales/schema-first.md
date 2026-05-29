# Schema-first locale files

i18nprune treats your **source code** as the shape of truth for which translation keys exist. Locale JSON on disk is read and written using that schema — not by copying how the English file happens to be nested.

## What that means

- **Generate** fills a target locale with strings only for keys your app actually uses (plus policy rules). A brand-new `fr.json` does not need to mirror every nested object from `en.json` first.
- **Sync** aligns each target file to the current schema: adds missing keys, updates changed source text, and can remove keys that no longer appear in code.
- **Reading** still accepts both flat dotted keys and nested objects; conflicts are resolved predictably (nested wins over a duplicate dotted key). See [Locale filesystem layouts](./layouts.md) for where files live on disk.

## Examples

### Generate writes nested paths only

If your scan resolves `sidebar.settings` and `actions.save`, generate can produce:

```json
{
  "sidebar": {
    "settings": "Paramètres"
  },
  "actions": {
    "save": "Enregistrer"
  }
}
```

even when the source file used flat keys like `"sidebar.settings": "Settings"`.

### Sync keeps targets aligned with code

When you remove a `t('legacy.banner')` call, **sync** can drop `legacy.banner` from target locales after merge/prune. Keys you add in code but not yet in `fr.json` are filled from the source locale (subject to preserve/parity settings).

### Resume on a missing target file

**`generate --resume`** normally only re-translates leaves that still look like English copies. If the target file does not exist yet (for example `locales/so.json`), the CLI initializes the run from the source strings and translates them — you do not need a separate full generate first.

## Related

- [Locale filesystem layouts](./layouts.md) — `flat_file`, `locale_per_dir`, `feature_bundle`
- [Locales overview](./README.md)
- [Metadata mode](./metadata/README.md)
