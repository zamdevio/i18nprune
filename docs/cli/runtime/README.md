# CLI runtime (`RunOptions` & env)

**Verbosity and env overrides** live under **`src/core/runtime/`** and **`src/core/context/`**:

- **`getRunOptions`**, **`setRunOptions`**, **`resetRunOptions`** — `src/core/runtime/options.ts`
- **`setCliYesFlag`**, **`getCliYesFlag`**, **`getI18nPruneEnvSnapshot`** — `src/core/context/globals.ts` (CLI process state + `I18NPRUNE_*` snapshot for `config --json`)
- **`loadEnvOverrides`**, **`applyEnvToConfig`** — `src/core/context/env.ts` (shared env key list: `types/core/context/env.ts`)
- **`getCliGlobalOverrides`**, **`setCliGlobalOverrides`**, **`resetCliGlobals`** — `src/core/context/globals.ts`

Full merged config + paths: **`resolveContext()`** (`src/core/context/resolve.ts`).
