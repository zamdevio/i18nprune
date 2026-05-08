# Repository tree

This page only documents the repository structure and component relationships.

## Layout (apps + packages)

```
.
├── apps/
│   ├── docs/                  # VitePress docs app
│   ├── extension/             # VS Code extension scaffold
│   ├── landing/               # Vite + React landing site
│   ├── report/                # Vite SPA for report visualization
│   ├── web/                   # Vite + React runtime web console
│   └── workers/
│       ├── github/            # Cloudflare Worker: GitHub integration/cache
│       └── i18nprune/         # Cloudflare Worker: main i18nprune API
├── docs/                      # Authoritative markdown source
├── packages/
│   ├── cli/                   # CLI package
│   ├── core/                  # Runtime-agnostic engines and adapters
│   └── report/                # Shared report schema/types
├── scripts/                   # Repository scripts
├── tests/
│   ├── fixtures/
│   └── integration/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

## Component relationships

| Surface | Role | Depends on |
|---|---|---|
| `packages/core` | Shared operation engines and runtime adapters | — |
| `packages/report` | Report schema/types shared across apps | used by `apps/report`, `apps/web`, `packages/core` |
| `packages/cli` | Node CLI orchestration and host I/O | `i18nprune/core` |
| `apps/web` | Browser runtime console (local + remote worker) | `@i18nprune/core`, `@i18nprune/report` |
| `apps/report` | Report UI viewer | `@i18nprune/report` |
| `apps/landing` | Product landing app | app-local UI modules |
| `apps/docs` | Primary docs site | root `docs/` content sync |
| `apps/workers/i18nprune` | Main HTTP API worker | worker runtime + core contracts |
| `apps/workers/github` | GitHub-focused worker | worker runtime |

