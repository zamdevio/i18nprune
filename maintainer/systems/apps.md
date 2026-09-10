# Apps & portals inventory

Honest status for reviewers / agents — what ships where. Domains are live product unless noted.

| Surface | Package | Live URL / channel | Status |
|---------|---------|----------------------|--------|
| **Landing** | `apps/landing` | [i18nprune.dev](https://i18nprune.dev) | **Shipped / maintained** |
| **Docs** | `apps/docs` | [docs.i18nprune.dev](https://docs.i18nprune.dev) | **Shipped / maintained** |
| **Web (runtime demo)** | `apps/web` | [web.i18nprune.dev](https://web.i18nprune.dev) | **Shipped / maintained** |
| **Report SPA** | `apps/report` | [report.i18nprune.dev](https://report.i18nprune.dev) | **Shipped / maintained** |
| **Releases portal** | `apps/releases` | [releases.i18nprune.dev](https://releases.i18nprune.dev) | **Shipped / maintained** |
| **Git analytics** | `apps/git` | [git.i18nprune.dev](https://git.i18nprune.dev) | **Shipped / maintained** |
| **Share worker** | `apps/workers/i18nprune` | [worker.i18nprune.dev](https://worker.i18nprune.dev) | **Shipped / maintained** |
| **Meta worker** | `apps/workers/meta` | meta / version endpoints for landing SEO | **Shipped / maintained** |
| **VS Code extension** | `apps/extension` (+ webview) | Marketplace — **not** the primary v1 publish yet | **In progress** — see [`phases/extension/`](../phases/extension/README.md) |

**Packages (not apps):** `@i18nprune/core`, CLI (`i18nprune` on npm), `@i18nprune/ui`, `@i18nprune/seo` — published / consumed by the surfaces above.

**Not aspirational:** the Cloudflare Pages + Workers portals above are real. Extension is the one still in the phase board as product work, not “scaffold forever.”

**Release note:** bump `FALLBACK_CLI_VERSION` in `apps/landing` + `packages/seo` when cutting the next npm version (cold meta miss still shows the fallback).
