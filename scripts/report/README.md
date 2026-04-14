# `scripts/report/` (build helpers)

These steps plug the report SPA into **`dist/`** for the CLI bundle. They follow **`tsup`** and **`scripts/flatten-cli-dts.mjs`** (see **`scripts/README.md`**).

| Script | Purpose |
|--------|---------|
| **`flatten-report-dts.mjs`** | Runs **after** `tsup`. `tsup` emits `dist/report/src/index.d.ts`; this script copies it to **`dist/report.d.ts`** so `package.json` **`exports["./report"].types`** points next to **`dist/report.js`**. |
| **`copy-template.mjs`** | Runs **after** **`vite build`** for **`apps/report`**. Copies **`apps/report/dist/index.html`** into **`dist/report/index.html`** and **`packages/cli/dist/report/index.html`** so the CLI can ship the offline report UI next to **`dist/cli.js`**. |

Order in **`package.json`**: `tsup` → `flatten-cli-dts` → `flatten-report-dts` → `build:report` (Vite) → `copy-template`.
