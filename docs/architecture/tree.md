---
description: Monorepo layout map — packages, apps, docs mirror, and how CLI, core, and hosts relate.
---

# Repository tree

This page documents repository structure and component relationships.

## Layout (apps + packages)

```text
.
├── apps/
│   ├── docs/
│   ├── extension/
│   ├── landing/
│   ├── report/
│   ├── web/
│   └── workers/
├── docs/
├── packages/
│   ├── cli/
│   ├── core/
│   └── ui/
├── scripts/
├── tests/
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
| `packages/cli` | Node CLI orchestration and host I/O | `@i18nprune/core` (workspace) |
| `apps/docs` | Public docs site | root `docs/` content sync |
| `apps/extension` | VS Code extension host (**in development**, post-v1) | `@i18nprune/core`, CLI JSON contracts |
| `apps/web` | Shared workspace web app | `@i18nprune/core`, `@i18nprune/ui` |
| `apps/report` | Report SPA (embedded in CLI + hosted) | `@i18nprune/core`, `@i18nprune/ui` |
| `apps/workers/i18nprune` | Project/workspace API worker | `@i18nprune/core` |
| `apps/workers/meta` | Public metadata API worker | worker runtime only |
