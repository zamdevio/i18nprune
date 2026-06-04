<div align="center">

# i18nprune · Releases portal

[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Static release notes** for the CLI, Core SDK, and VS Code extension.

**Production:** [releases.i18nprune.dev](https://releases.i18nprune.dev)

</div>

---

## What this is

`apps/releases` is the **i18nprune release portal** — a Vite + React SPA backed by versioned YAML in `content/`. Each stream (CLI, Core, Extension) has its own semver line.

Maintainers edit YAML, run `pnpm validate` and `pnpm generate:catalog`, then ship `dist/` to static hosting.

---

## Repo layout

```text
apps/releases/
├── content/              # source of truth (per-stream YAML)
├── schema/               # release.schema.json
├── scripts/              # validate.ts, generate.ts, github-release-body.ts
│   └── lib/              # utils, build, rules, helpers
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── layout/       # index.tsx, header/, footer/
│   ├── features/
│   │   ├── catalog/      # index.ts (catalog), streams.ts, semver.ts
│   │   ├── release/      # card, timeline, list, install, filters, …
│   │   ├── compare/      # releases.ts, CompareDiffView, CompareNavMenu
│   │   ├── compat/       # graph.ts, release.tsx, overflow.tsx
│   │   └── search/       # search.ts, highlight.tsx, dashboard.tsx, keyboard.ts
│   ├── types/            # stream, release, catalog, compat barrels
│   ├── components/       # shared primitives + ui/ (shadcn)
│   ├── pages/
│   ├── lib/              # cn, install-snippets, theme-storage
│   ├── styles/index.css
│   └── data/             # generated releases.json (gitignored)
├── public/
│   ├── favicon.ico, i18nprune.svg, robots.txt, _redirects
│   └── feed.xml, atom.xml, sitemap.xml, data/  # generated (gitignored)
└── vite.config.ts
```

---

## Scripts

| Root | App filter |
|------|------------|
| `pnpm releases:dev` | dev (`predev` → `generate:catalog`) |
| `pnpm releases:build` | validate + generate:catalog + vite build |
| `pnpm releases:validate` | schema + compat on `content/` |
| `pnpm releases:typecheck` | app + scripts |
| `pnpm releases:deploy` | build + Cloudflare Pages |

| App script | Purpose |
|------------|---------|
| `generate:catalog` | runs `scripts/generate.ts` → catalog JSON + feed.xml + atom.xml + sitemap.xml |
| `validate` | JSON Schema on `content/` |
| `github-release-body` | Markdown for GitHub Releases (`--stream` / `--version`) |

Script details: [`scripts/MAINTAINERS.md`](./scripts/MAINTAINERS.md).

**Naming:** **`generate:catalog`** → `scripts/generate.ts` (not `build:releases`; root `releases:build` is Vite). Catalog reader: `src/features/catalog/index.ts` (`ReleaseCatalogV1` in `src/types/`). **Public feeds:** `/feed.xml`, `/atom.xml`, `/sitemap.xml` (generated into `public/`).

---

## Add a release

1. Add `content/<stream>/<version>.yaml`
2. `pnpm releases:validate`
3. `pnpm --filter @i18nprune/releases generate:catalog`
4. `pnpm releases:build`

```bash
pnpm --filter @i18nprune/releases github-release-body -- --stream cli --version 0.1.0
```
