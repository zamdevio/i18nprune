# Patching Config Reference

This page documents `i18nprune.config.ts` patching fields, validation behavior, and execution policy.
Loader ownership and generated module details are in [loader.md](./loader.md).

## Configuration shape

Minimum recommended shape:

```ts
patching: {
  enabled: boolean;
  recipe: "loader_generated";
  configPath: string;
  loaderPath: string;
}
```

Common optional fields:

- `mode`: `"warn_skip"` (default) or `"strict"`
- `sizeLimitBytes`: max read-size guard for patching reads
- `localeJsonImportBase`: directory of locale `*.json` files, expressed relative to the config file’s folder (typically the repo root; see **`loader_generated` fields** below)
- `loaderPath`: generated loader path (CLI-owned output)

## `loader_generated` fields

For recipe `loader_generated`:

- `configPath` - required
- `loaderPath` - required (`src/i18n/loaders.generated.ts`)
- `localeJsonImportBase` - optional; default resolved as **`locales`**. Paths are interpreted **relative to the project root**, i.e. the directory containing your **`i18nprune`** config file (same basis as **`configPath`** / **`loaderPath`** in a typical repo layout). Core still computes relative `import()` paths inside **`loaders.generated.ts`** from the generated file location.

## `config.json` contract

`configPath` must resolve to JSON shaped like:

```json
{
  "locales": [
    { "code": "en", "englishName": "English", "nativeName": "English", "direction": "ltr" }
  ]
}
```

Additional keys are preserved.

## Metadata and drift repair model

During patch analysis and fix flow:

- Missing locale metadata fields (`englishName`, `nativeName`, `direction`) are identified and can be auto-corrected from language catalog defaults.
- Catalog mismatches are detected and surfaced as diagnostics.
- Config/file locale drift is detected in both directions:
  - locale in config but missing JSON file
  - locale JSON file exists but missing config record
- `i18nprune patch --fix` applies supported automatic corrections.

## Source/default locale policy

For `loader_generated`:

- Source locale from CLI context is the canonical fallback.
- If source locale is missing from config locales, patching restores it.
- `DEFAULT_LOCALE_CODE` remains unchanged only while valid; otherwise it is reset to source locale.

## Failure and mode behavior

`warn_skip` (default):

- emits diagnostics
- skips patch writes when state is invalid

`strict`:

- returns non-OK patch result for the same invalid states
- allows host commands to fail fast

Typical causes:

- missing required recipe paths
- file missing / path is not a file / read failure
- config parse or schema failure
- unsupported loader structure for patching anchors
- read-size limit violations
- apply failure (with rollback attempt)

## CLI interactions

- `--patch` enables patching for the current mutation command run (overriding config default off for that run).
- `i18nprune patch` inspects patching health.
- `i18nprune patch --fix` applies automatic fixable corrections.
- `i18nprune patch --init` creates missing scaffold files.
- `i18nprune patch --init --force` renews only CLI-owned files (`config.json`, `loaders.generated.ts`) and resets the patching config block to defaults (add your own integration module next to them if you want — see [loader.md](./loader.md)).

Related:

- [Auto-patching overview](./README.md)
- [Loader contracts](./loader.md)
