# `@zamdevio/i18nprune-report` (source)

This folder is the **single source of truth** for the `i18nprune.projectReport` JSON contract:

- **Constants** — `PROJECT_REPORT_KIND`, `PROJECT_REPORT_SCHEMA_VERSION`, `REPORT_INLINE_PAYLOAD_PLACEHOLDER`
- **Types** — `ProjectReportDocument` and related shapes
- **Schema** — `projectReportDocumentSchema` (Zod), used by the CLI and the report SPA

## Published import path (use this in apps and tools)

Same semver as the CLI:

```ts
import {
  projectReportDocumentSchema,
  PROJECT_REPORT_SCHEMA_VERSION,
  type ProjectReportDocument,
} from '@zamdevio/i18nprune/report';
```

Root `package.json` `"exports"` maps `@zamdevio/i18nprune/report` → `dist/report.js` and **`dist/report.d.ts`**. After `tsup`, `scripts/report/flatten-report-dts.mjs` copies the emitted declaration file to that stable path (the compiler initially writes under `dist/packages/report/...`).

**Internal package name** `packages/report/package.json` → `@zamdevio/i18nprune-report` is **private**; it exists so the workspace has a clear folder and optional `peerDependencies`. **Do not** publish it separately unless you intentionally split releases.

## What `PROJECT_REPORT_SCHEMA_VERSION` is (and is not)

- **It is** the **document format version** embedded in every `i18nprune.projectReport` JSON (`schemaVersion` field). When the JSON shape changes in a breaking way, this number increments and the CLI + Zod schema + report UI are updated together.
- **It is not** the npm version of `@zamdevio/i18nprune` or of this folder. Those can move independently; the **payload** carries `schemaVersion` so consumers can reject or explain mismatches.

**Who sets it:** `i18nprune report` when building the document (`src/commands/report/build.ts`).

**Who reads it:** Zod validation (`--from`, HTML injection), CSV/text exporters, and the report SPA (`apps/report`). The SPA shows a dedicated error when `schemaVersion` does not match `PROJECT_REPORT_SCHEMA_VERSION` baked into that HTML build.

## Monorepo resolution (no deep relatives)

- **CLI / Vitest:** root `tsconfig.json` `paths` → `packages/report/src/index.ts`
- **Report SPA:** `apps/report/vite.config.ts` `resolve.alias` → same file

## Troubleshooting

| Symptom | What to do |
|--------|------------|
| TypeScript cannot resolve `@zamdevio/i18nprune/report` | Use the repo `tsconfig` paths / Vite alias above; do not import from `dist/` by hand in source. |
| `pnpm run build` fails on missing `apps/report/dist/index.html` | Run from repo root; ensure `apps/report` exists and `pnpm run build:report` succeeds. |
| HTML report generation says template missing | Full root `pnpm run build` must run so `dist/report/index.html` exists beside `dist/cli.js` (see `scripts/report/copy-template.mjs`). |
| JSON opens in SPA but “Unsupported schema version” | Regenerate JSON/HTML with the **same** CLI major line, or align `schemaVersion` in JSON with `PROJECT_REPORT_SCHEMA_VERSION` in `packages/report/src/constants.ts`. |

## See also

- [`docs/report/README.md`](../../docs/report/README.md) — SPA behavior and payload contract
- [`docs/commands/report/README.md`](../../docs/commands/report/README.md) — CLI `report` command
