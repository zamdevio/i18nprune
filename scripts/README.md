# Build scripts (repo root)

| Script | When | Purpose |
|--------|------|---------|
| **`flatten-cli-dts.mjs`** | After **`tsup`**, before report flatten | Copies **`dist/cli/src/exports/config.d.ts`** and **`core.d.ts`** to **`dist/config.d.ts`** / **`dist/core.d.ts`** so **`package.json`** `exports["./config"]` / `./core` **types** match the flat **`dist/*.js`** layout. |
| **`report/flatten-report-dts.mjs`** | After **`flatten-cli-dts`** | Copies report declarations to **`dist/report.d.ts`**. See **`report/README.md`**. |
| **`report/copy-template.mjs`** | After **`vite build`** for **`apps/report`** | Copies embedded HTML into **`dist/report/`**. See **`report/README.md`**. |

Full order: **`pnpm run build`** → `tsup` → `flatten-cli-dts` → `flatten-report-dts` → `build:report` → `copy-template`.
