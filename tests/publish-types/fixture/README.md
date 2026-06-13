# Publish types fixture

Mini **npm consumer** project that installs the **packed** root `i18nprune` tarball (not workspace `@i18nprune/core`). Use it to confirm published `.d.ts` files typecheck like a real downstream app.

## Why it exists

`tsup` DTS rollup for `export * as namespace` barrels can emit invalid lines such as:

```ts
declare const translator_TranslatePolicy: typeof TranslatePolicy;
```

when `TranslatePolicy` is type-only. Consumers with `skipLibCheck: false` then hit **TS2693** (“only refers to a type, but is being used as a value”).

| Layer | What it checks |
|-------|----------------|
| **Automated (CI / `pnpm test`)** | `tests/publish-types/core-dts-aliases.test.ts` runs `scripts/dts/fix-core-dts.mjs` after `cli:build` sanitizes `dist/core.d.ts`. |
| **Manual (this fixture)** | Installs the tarball and runs `tsc` on small import samples — catches regressions in **published** export paths (`i18nprune/core`, `i18nprune/core/config`, type-only vs value re-exports). |

Knip does not treat this folder as an entry graph; the `src/*.ts` files are **intentional** manual smoke sources (see root `knip.json` ignore).

## Fixture sources

| File | Exercises |
|------|-----------|
| `src/barrel-type-only.ts` | Type-only imports from `i18nprune/core` (`Issue`, `RuntimeAdapters`). |
| `src/barrel-value.ts` | Value + type imports from `i18nprune/core` (`defineConfig`, `runSync`, `I18nPruneConfig`). |
| `src/config-subpath.ts` | `i18nprune/core/config` subpath export. |

## One command (recommended)

From the **repository root**:

```bash
pnpm run publish:verify
```

Runs `cli:build`, DTS alias test (`scripts/dts/fix-core-dts.mjs --test`), `pnpm pack`, fixture install, and `tsc` with `--skipLibCheck false`.

Faster when `dist/` and `i18nprune-<root-version>.tgz` already exist:

```bash
pnpm run publish:verify:fixture
```

Flags on the runner: `node tests/publish-types/run.mjs --skip-build` · `--skip-pack`.

## Manual workflow

Same steps as `publish:verify`, by hand:

```bash
pnpm run cli:build
pnpm pack
cd tests/publish-types/fixture
rm -rf node_modules && pnpm install --ignore-workspace
pnpm exec tsc -p tsconfig.json --skipLibCheck false
```

Quick pass with lib checking disabled (app sources only):

```bash
pnpm exec tsc -p tsconfig.json --skipLibCheck true
```

`run.mjs` syncs the fixture `package.json` dependency to `file:../../../i18nprune-<version>.tgz` from root `package.json` before install (and drops a stale fixture lockfile).

## Prerequisites

- `i18nprune-<version>.tgz` at the repo root (from `pnpm pack`, version = root `package.json`).
- `pnpm run cli:build` so `prepack` / DTS fix have already produced a clean `dist/core.d.ts` inside the tarball.
