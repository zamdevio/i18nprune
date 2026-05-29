# Stack fixtures

Minimal **framework-shaped** trees under `tests/fixtures/stacks/` — no `node_modules`, no real framework installs. Each directory is a standalone i18nprune project (`i18nprune.config.mjs` + `src` or `app` + locale files).

Integration smoke (`tests/integration/fixtures.smoke.test.ts`) discovers every fixture app under `tests/fixtures/` and runs `config --json`, `doctor --json`, `validate --json`, and `generate --json --dry-run --target fr` (when the fixture has a valid config).

Stack `.tsx` files share `tests/fixtures/stacks/tsconfig.json` (`jsx: react-jsx`) so the IDE does not require `React` in scope per fixture.

## Index

| Fixture | What it proves |
| --- | --- |
| `vue-sfc/` | Vue 3 SFC (`.vue`) with `t()` in `<script setup>`; `flat_file` + `locale_file` (`locales/en.json`). |
| `react-tsx/` | React / Vite-shaped `.tsx` under `src/`; `flat_file` + `locale_file`; optional `cache.profile`. |
| `nextjs/` | Next.js App Router: `feature_bundle` with **five features** (`app`, `common`, `auth`, `marketing`, `settings`) and matching `app/components/*.tsx`. |
| `svelte-kit/` | Svelte: `locale_per_dir` with **five segments per locale** (`app`, `nav`, `footer`, `errors`, `forms`) wired from `+page` + `lib/*.svelte`. |
| `nuxt-vue/` | Nuxt-like paths (`src/pages/`, `src/components/`) with Vue SFCs; `locale_per_dir` (`locales/en/messages.json`). |
| `remix-routes/` | Remix-style `app/routes/*.tsx` route modules; `locale_per_dir` (`locales/en/messages.json`). |

## Skipped (extractor)

| Planned | Status |
| --- | --- |
| `astro-pages/` | **Not included** — core scan globs match `tsx`, `jsx`, `vue`, `svelte`, etc., but **not** `.astro` (`packages/core/src/shared/scanner/files.ts`). Add when `.astro` is in scan extensions. |

## Manual smoke

From repo root after `pnpm cli:build`:

```bash
cd tests/fixtures/stacks/<name>
node ../../../../dist/cli.js validate --json
```
