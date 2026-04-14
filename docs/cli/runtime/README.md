# CLI runtime (`RunOptions` & env)

**Verbosity and env overrides** live under **`packages/cli/src/core/runtime/`** and **`packages/cli/src/core/context/`**:

- **`getRunOptions`**, **`setRunOptions`**, **`resetRunOptions`** — `packages/cli/src/core/runtime/options.ts`
- **`setCliYesFlag`**, **`getCliYesFlag`**, **`getI18nPruneEnvSnapshot`** — `packages/cli/src/core/context/globals.ts` (CLI process state + `I18NPRUNE_*` snapshot for `config --json`)
- **`loadEnvOverrides`**, **`applyEnvToConfig`** — `packages/cli/src/core/context/env.ts` (shared env key list: `types/core/context/env.ts`)
- **`getCliGlobalOverrides`**, **`setCliGlobalOverrides`**, **`resetCliGlobals`** — `packages/cli/src/core/context/globals.ts`

Full merged config + paths: **`resolveContext()`** (`packages/cli/src/core/context/resolve.ts`).
