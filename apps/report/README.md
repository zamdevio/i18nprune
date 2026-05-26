<div align="center">

# i18nprune · Report SPA

[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Offline](https://img.shields.io/badge/output-single%20HTML-334155)](./vite.config.ts)
[![Hash routes](https://img.shields.io/badge/routing-HashRouter-0ea5e9)](./src/App.tsx)

**Single-file, offline analytics UI** embedded by `i18nprune report --format html`.

[Full documentation](../../../docs/report/README.md) · [Report command](../../../docs/commands/report/README.md)

</div>

---

## What this is

A **React + TypeScript** app (Vite, `vite-plugin-singlefile`) that compiles to **`dist/index.html`** in this app. The CLI **injects** the project report JSON into a `<script id="i18nprune-inline-payload">` so the same file works from disk or CI with **no server**.

It is **not** a general admin UI: it is tuned for **i18nprune project reports** (missing keys, dynamic sites, observations, hotspots, namespaces, risk score, environment metadata).

### Branding / `CLI_NAME`

The SPA imports **`CLI_NAME`** and **`CLI_VERSION`** from **`src/constants/cli.ts`**, re-exported from the repo root **`src/constants/index.ts`** via the **`i18nprune/constants`** alias in **`vite.config.ts`**.

**`index.html` `<title>`** is static HTML and cannot import those constants. If you rename the CLI in **`src/constants/cli.ts`**, update **`apps/report/index.html`** manually so the browser tab matches.

---

## Features

| Area | Behavior |
|------|----------|
| **Routes** | `/#/` overview, `/#/missing`, `/#/dynamic`, `/#/observations`, `/#/heatmap`, `/#/namespaces` |
| **Search** | One global query filters list pages; **no matches** state with clear action |
| **Pagination** | Per-section page + **persisted** rows-per-page (`localStorage`) |
| **Theme** | Light / dark / system, persisted; **custom dropdown** (matches editor UX) |
| **Editor links** | `vscode://`, `cursor://`, `antigravity://`, `windsurf://`, `zed://` from report paths (desktop layout) |
| **Docs links** | Footer uses **`src/constants/docs.ts`** (same GitHub paths as CLI) |

---

## Repo layout (`apps/report/`)

```
apps/report/
├── vite.config.ts          # build → apps/report/dist
├── index.html              # root mount + payload script placeholder
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── data/               # loader, mock, Zod schema
    ├── context/            # report, search, pagination, editor
    ├── components/         # shell, toolbar dropdowns, tables, errors
    ├── pages/              # one route per folder (index.tsx)
    ├── lib/                # docs re-export, paths, editor hrefs, formatters
    ├── theme/              # ThemeProvider + persistence
    └── styles/global.css
```

---

## Scripts (package root)

| Script | Purpose |
|--------|---------|
| `pnpm dev:report` | Vite dev server (mock data when no payload) |
| `pnpm build` | Runs `tsup` + **Vite report build** (required before packaging HTML reports) |
| `pnpm build:report` | Report SPA only |

---

## Documentation map

| Doc | Content |
|-----|---------|
| [`docs/report/README.md`](../../../docs/report/README.md) | SPA behavior, patterns, payload contract |
| [`docs/commands/report/README.md`](../../../docs/commands/report/README.md) | CLI `report` command only (flags, formats, `--from`) |

---

## Quality

- Unit tests under `apps/report/src/lib/__tests__/`
- Payload / HTML wiring covered by CLI tests (`src/commands/report/__tests__/`, `tests/integration/`)
