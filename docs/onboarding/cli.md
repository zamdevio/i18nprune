---
description: Install i18nprune from npm, create config with init, and run validate or sync in your first project.
---

# CLI onboarding path

## Install
Install the CLI from npm and run it as `i18nprune`.

Example:
```bash
npm i i18nprune
# run: npx i18nprune ...
```

## Init / config
If you do not have a config file yet, generate one:

```bash
i18nprune init
```

Edit `i18nprune.config.*` to match your project layout and policies. See [Config](../config/README.md).

## Validate (read-only)
Use `validate` to check that your translation calls match your source locale JSON.

```bash
i18nprune validate
i18nprune validate --json
```

## Sync (structure alignment)
Use `sync` to update non-source locale JSON so the file structure matches the source.

```bash
i18nprune sync --dry-run
i18nprune sync
```

## Generate / missing (target locale updates)
Use `generate` to translate and write target locale files:

```bash
i18nprune generate --target ja
```

Use `missing` to add placeholder values for literal keys that exist in code but are not present in the chosen locale file(s):

```bash
i18nprune missing
```

## Cache flags (when you want speed and diagnostics)
If you run repeated scans, read the CLI cache behavior and flags: [CLI cache](../cli/cache.md).

Useful knobs include `--no-cache`, `--debug-cache`, and `--cache-profile`.

## What to read next
- [CI path](./ci.md)
- [`generate`](../commands/generate.md)
- [`missing`](../commands/missing.md)
- [CLI cache](../cli/cache.md)
