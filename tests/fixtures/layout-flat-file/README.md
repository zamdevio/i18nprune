# layout-flat-file

Minimal fixture: **`flat_file`** + **`locale_file`** (`locales/<code>.json` at bundle root).

```bash
cd tests/fixtures/layout-flat-file
node ../../../dist/cli.js locales list --json
node ../../../dist/cli.js validate --json
```
