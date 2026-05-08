# Locales Metadata Mode

Shared writer behavior for `sync`, `generate`, and `fill`.

## Two different “metadata” concepts

1. **`<lang>.meta.json` (locale sidecar)** — Small JSON next to **`<lang>.json`** with **`lang`**, **`englishName`**, **`nativeName`**, **`direction`** for tooling and UIs. By default **`generate`** and **`fill`** create or refresh this sidecar whenever they write a target locale (independent of **`--metadata`**). Skip with **`--no-locale-meta`** or root config **`noLocaleMeta: true`** (either skips; see [generate](../../commands/generate/README.md) and [fill](../../commands/fill/README.md) “Locale sidecar” sections).
2. **`--metadata` on writers** — Opts in to **structured per-leaf** objects **inside** **`<lang>.json`** (`value` + translation/review fields). Documented below as “structured leaves”.

## Who writes what (`--metadata` vs core)

- **`generate --metadata`** and **`fill --metadata`** (CLI): the CLI tells core to **persist** structured leaves built from **`translateLeaf`** output (`value` + merged **`TranslationLeafMeta`**, including provider/heuristic scores and **`needsTranslationAgain`**). Core **always** computes that metadata; the flag only gates **writing** to disk.
- **`sync --metadata`**: no translation APIs — applies the same **normalize / promote / repair** pipeline so each source path gets a **default-shaped** structured leaf (template values from the locale + source, repairs corrupt nodes). This is **not** the same as re-running **`translateLeaf`** on every string.
- **`sync --strip-metadata`**: strips **structured terminal** metadata back to **plain strings** for every affected leaf (rollback). That removes **`needsTranslationAgain`** along with **`status`**, **`confidence`**, **`needsReview`**, and **`source`** — only the **`value`** string remains.

## Modes

- **`legacy_string`** (default): write plain string leaves.
- **`structured`**: write/repair structured leaves:
  - `value: string`
  - `status: string` (normalized default: `"translated"`)
  - `confidence: number | null` (invalid values normalized to `null`)
  - `needsReview: boolean` (invalid/missing normalized to `false`)
  - `needsTranslationAgain: boolean` (invalid/missing normalized to `false`)
  - `source: string` (normalized default: `"manual"`)

Config:

```ts
// i18nprune.config.ts
export default {
  localeLeaves: {
    mode: 'legacy_string', // default
    sync: {
      stripMetadata: false,
    },
  },
};
```

## CLI flags

- `sync --metadata` / `generate --metadata` / `fill --metadata`
  - Enables structured write/repair for that run.
- `sync --strip-metadata`
  - Converts structured leaves back to plain strings.

`sync --strip-metadata` is the explicit rollback path for metadata fields.
If both `sync --metadata` and `--strip-metadata` are passed, `--strip-metadata` wins and JSON `issues[]` includes `i18nprune.sync.metadata_flag_conflict`.

## Corrupt and partial metadata handling

When structured mode is enabled, writer commands normalize each source leaf path:

- legacy string leaf → promoted to structured.
- malformed/non-object leaf → replaced with safe structured default.
- partial/invalid structured fields → repaired and reported.

Current policy is **repair + report** (no strict failure mode yet).

## Programmatic API

Use shared core helpers:

- `applyLocaleLeafMode()`
- `metadataModeEnabledFromConfig()`

They return rich report data per locale:

- total leaf paths considered
- unchanged vs changed leaves
- promoted legacy leaves
- repaired corrupt leaves
- stripped structured leaves
- changed path samples + reason buckets
- full `leafDecisions[]` (per source leaf path): kind before/after, action, reasons, and before/after values

This report is attached in per-command JSON payload rows (`targetResults` for `generate`/`fill`, and `localeMetadataReports` for `sync`) and can also be used directly in API integrations.

## Dry-run behavior

Dry-run commands still compute metadata normalization reports without writing files, so automation can preview:

- exactly what would be promoted/repaired/stripped
- reason buckets for metadata repairs
- per-target/per-file metadata impact
- per-leaf simulation details (`leafDecisions`) for custom reporting pipelines
