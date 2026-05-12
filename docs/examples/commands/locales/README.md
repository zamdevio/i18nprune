# Locales Examples

## Discover and list

```bash
i18nprune locales list
i18nprune locales list --json | jq '.data.locales'
```

## Edit / dynamic / delete entrypoints

```bash
i18nprune locales edit --help
i18nprune --patch locales edit --target ja --english-name "Japanese" --native-name "日本語" --direction ltr
i18nprune --json locales edit --target all
i18nprune locales dynamic --help
i18nprune locales delete --help
```

## Timing

```bash
time i18nprune locales list --json | jq '.meta.command'
```

## Global flag coverage

```bash
# compact JSON for locales list
i18nprune -c i18nprune.config.ts --json locales list --json-pretty false

# run artifact for locales operations
i18nprune --config i18nprune.config.ts stdout redirection ./out/locales-delete-run.txt --format text --yes locales delete --target ja
```

See command references:
- `docs/commands/locales/list/README.md`
- `docs/commands/locales/edit/README.md`
- `docs/commands/locales/dynamic/README.md`
- `docs/commands/locales/delete/README.md`
