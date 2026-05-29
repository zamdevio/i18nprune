# Patching fixture

Minimal project demonstrating **loader/config patching** (`patching.recipe: loader_generated`).

## Intentional drift (pre-`patch --fix`)

| On disk | In `src/i18n/config.json` |
|---------|---------------------------|
| `locales/en.json`, `locales/fr.json`, `locales/ar.json` | **`en` only** |

`src/i18n/loaders.generated.ts` is empty until patched.

## Manual flow

From repo root after `pnpm cli:build`:

```bash
cd tests/fixtures/patching
node ../../../dist/cli.js patch --fix --yes
node ../../../dist/cli.js --patch sync --yes --target fr
node ../../../dist/cli.js --patch generate --yes --target fr
```

Integration: `tests/integration/patching.cliChain.test.ts` copies this tree into a temp dir (MyMemory for generate).

Smoke: listed under `patching` — doctor/validate may report drift until `patch --fix`; strict `ok: true` checks are relaxed like other intentional fixtures.
