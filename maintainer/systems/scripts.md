# Root package scripts (grouping)

`package.json` **`scripts`** are executable only — no empty `"// section": ""` comment keys.

Logical groups (for humans):

| Group | Scripts (examples) |
|-------|--------------------|
| Gate | `build`, `typecheck`, `test`, `parity` |
| Core + CLI | `core:build`, `cli:build`, `cli:dev`, `dts:fix` |
| Release | `versions:*`, `publish:verify*` |
| UI | `ui:typecheck`, `ui:purity`, `ui:sync:swagger-css` |
| Apps | `docs:*`, `web:*`, `landing:*`, `report:*`, `releases:*`, `git:*` |
| Workers | `meta:*`, `worker:*` |
| Extension | `ext:*` |
| Hygiene | `knip`, `madge:*`, `empty:*` |

**Turbo aliases** (`//#test`, `//#parity`, `//#cli:build`, `//#ui:purity`) stay — CI/Turbo invoke them by name (`pnpm turbo run //#test`). Do not rename without updating `.github/workflows/ci.yml`.

**Path aliases (Vitest + tsup):** [`scripts/dev/pathAliases.mjs`](../../scripts/dev/pathAliases.mjs) — single runtime map; keep in sync with `tsconfig.json` `paths` when adding aliases used by tests or the CLI bundle.

**tsup `createRequire` banner:** intentional for Node ESM CLI — bundled commander still `require("events")`. Documented on `tsup.config.ts`; do not strip without an ESM-native commander path or externalizing commander.
