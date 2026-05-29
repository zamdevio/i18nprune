# Stack fixtures

Minimal **framework-shaped** trees under `tests/fixtures/stacks/` — no `node_modules`, no real framework installs. Each directory is a standalone i18nprune project (`i18nprune.config.mjs` + `src` or `app` + locale files).

Integration smoke (`tests/integration/fixtures.smoke.test.ts`) discovers every fixture app under `tests/fixtures/` and runs `config --json`, `doctor --json`, `validate --json`, and `generate --json --dry-run --target fr` (when the fixture has a valid config).

Stack `.tsx` files share `tests/fixtures/stacks/tsconfig.json` (`jsx: react-jsx`) so the IDE does not require `React` in scope per fixture.

## Index

| Fixture | What it proves |
| --- | --- |
| `vue-sfc/` | Vue 3 SFC (`.vue`) with `t()` in `<script setup>`; flat `locales/*.json`. |
| `react-tsx/` | React / Vite-shaped `.tsx` under `src/`; optional `cache.profile` in config. |
| `next-app-dir/` | Next.js App Router layout: `app/**/*.tsx`, `src: 'app'`. |
| `svelte-kit/` | Svelte (`.svelte`) with `t()`; `locale_directory` + `locale_per_dir` under `messages/`. |
| `nuxt-vue/` | Nuxt-like paths (`src/pages/`, `src/components/`) with Vue SFCs; flat locales. |
| `remix-routes/` | Remix-style `app/routes/*.tsx` route modules with `t()`. |

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
