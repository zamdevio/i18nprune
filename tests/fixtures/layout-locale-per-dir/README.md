# layout-locale-per-dir

Minimal fixture: **`locale_directory`** + **`locale_per_dir`** (`messages/<code>/*.json`).

```bash
# from repo root after pnpm build
cd tests/fixtures/layout-locale-per-dir
node ../../../dist/cli.js locales list --json
node ../../../dist/cli.js validate --json
```
