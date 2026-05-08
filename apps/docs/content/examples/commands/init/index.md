# Init Examples

## First-time setup

```bash
i18nprune init
i18nprune init --yes
i18nprune init --yes --rich
```

Generated **`i18nprune.config.ts`** uses **`import { defineConfig, type I18nPruneConfig } from 'i18nprune/config'`** and **`satisfies Partial<I18nPruneConfig>`** so your editor type-checks the object against the CLI schema (minimal and **`--rich`** templates both include this).

## Confirm config exists

```bash
i18nprune config --json | jq '.data.resolvedConfigPath'
```

## Timing

```bash
time i18nprune init --yes
```

## Global flag coverage

```bash
# explicit config path when bootstrapping in scripted runs
i18nprune -c i18nprune.config.ts init --yes

# init command run artifact
i18nprune stdout redirection ./out/init-run.json --format json init --yes
```
