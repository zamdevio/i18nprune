# Languages catalog

## Layout

The translation-target catalog is JSON **`{ code, english, native }`**. The committed artifact lives in core; the Node generator lives under `scripts/`.

- **File:** `packages/core/src/shared/languages/catalog/languages.json`
- **Loader:** `packages/core/src/shared/languages/catalog/index.ts` (browser-safe import of `languages.json`)

## Generator

- **Script:** `scripts/catalog/run.ts` (writes the core path above)
- **Input:** `scripts/catalog/codes.json`
- **Run:** `pnpm generate:languages`

Uses **`Intl.getCanonicalLocales`** and **`Intl.DisplayNames`** for labels.

## Regenerating

```bash
pnpm generate:languages
```

Commit updated `languages.json` when codes or labels change.
