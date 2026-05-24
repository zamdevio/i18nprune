# `@i18nprune/ui`

**Runtime cluster UI kit** — presentational primitives for `apps/web`, `apps/report`, and (later) worker Swagger shells.

**Canonical rules:** [`maintainer/systems/ui.md`](../maintainer/systems/ui.md)

## Phase 0 (scaffold)

This package is scaffolded only. No components are migrated yet.

## Purity (quick)

- **No** `@i18nprune/core`, workers, `react-router-dom`, `hono`, `zod`, `fflate`
- **No** routing, share, report ingest, or workspace logic
- Apps are **hosts** — pass URLs and data via props

## Exports (planned subpaths)

| Subpath | Purpose |
|---------|---------|
| `@i18nprune/ui/react` | React primitives barrel (prefer granular imports) |
| `@i18nprune/ui/react/theme` | Theme provider |
| `@i18nprune/ui/react/toolbar` | Toolbar dropdown |
| `@i18nprune/ui/react/overlay` | Modal / confirm |
| `@i18nprune/ui/react/feedback` | Copy button |
| `@i18nprune/ui/react/pagination` | List pagination |
| `@i18nprune/ui/styles/tokens.css` | Semantic CSS variables |
| `@i18nprune/ui/styles/runtime.css` | Shared component styles |
| `@i18nprune/ui/types` | Shared type barrels |
| `@i18nprune/ui/types/theme` | Theme types |
| `@i18nprune/ui/swagger` | Static Swagger HTML shell |
| `@i18nprune/ui/utils/clipboard` | Clipboard helpers |

## Health

```bash
pnpm ui:typecheck
pnpm ui:purity
```
