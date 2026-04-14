# Languages catalog

## Layout

The translation-target catalog is JSON **`{ code, english, native }`** shipped with the CLI:

- **File:** `packages/cli/src/core/languages/languages.json`
- **Loader:** `packages/cli/src/core/languages/index.ts`

## Generator

- **Script:** `scripts/languages/generate.ts`
- **Input:** `scripts/languages/codes.json`
- **Run:** `pnpm generate:languages`

Uses **`Intl.getCanonicalLocales`** and **`Intl.DisplayNames`** for labels.

## Regenerating

```bash
pnpm generate:languages
```

Commit updated `languages.json` when codes or labels change.
