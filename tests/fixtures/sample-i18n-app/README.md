# sample-i18n-app

Minimal **fake project** used by **Vitest integration tests** and for **manual CLI** trials from the repo root.

```bash
pnpm build
cd tests/fixtures/sample-i18n-app
node ../../../dist/cli.js validate
node ../../../dist/cli.js review --json
```

Edit `locales/en.json` and `src/main.ts` to experiment. Avoid comments that look like `t('…')` — the extractor scans the whole `src/` tree.
