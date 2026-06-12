# apps/extension — VS Code extension (workspace)

**VS Code** extension sources live here — **not** a browser extension.

**Plans & sequencing:** **[`maintainer/phases/extension/README.md`](../../maintainer/phases/extension/README.md)** — philosophy, architectural rules, phase index, gates (G1–G5), Tracks A–D, init onboarding (I1–I3), and links to each phase doc. Read that before changing scope here.

**Active runtime work:** **[`maintainer/phases/extension/multi-config-runtime.md`](../../maintainer/phases/extension/multi-config-runtime.md)** — multiple `i18nprune.config.*` in one window, hot project switching (no reload), per-config isolation, and the project registry consumers (sidebar, dashboard, future intelligence layer).

## Prerequisites

- Stable **`@i18nprune/core`** and documented CLI **`--json`** envelopes ([JSON output](../../docs/cli/json.md), [SDK operations](../../docs/sdk/operations.md)).

## Current state

- **`package.json`** — manifest, activation, and tooling as wired for this workspace.
- **Project discovery & selection** — `src/extension/workspace/` (`projectDiscovery`, `workspaceProjects`, filesystem watchers); baseline for [multi-config-runtime.md](../../maintainer/phases/extension/multi-config-runtime.md).
- Implementation follows **`maintainer/phases/extension/README.md`** (workspace settings, spawn-vs-core decision, tests before marketplace).

## Local development (F5)

Open the **monorepo root** (`i18nprune/`) in Cursor/VS Code — not `apps/extension` alone.

| Step | Action |
|------|--------|
| 1 | **Run and Debug** → **Run Extension** (builds via `pnpm ext:build`, then launches Extension Development Host) |
| 2 | Dev host opens this repo (root has `i18nprune.config.ts`) so the extension activates |
| 3 | Click the **i18nprune** activity bar icon |

Configs: [`.vscode/launch.json`](../../.vscode/launch.json) and [`.vscode/tasks.json`](../../.vscode/tasks.json) at repo root. Use **Run Extension (watch)** for host-only TS iteration (`pnpm ext:watch`); run **`pnpm ext:web:dev`** when editing the webview.

## Scripts (also at repo root)

From the monorepo root: **`pnpm ext:web:dev`**, **`pnpm ext:web:build`**, **`pnpm ext:compile`**, **`pnpm ext:watch`**, **`pnpm ext:build`** — same as `pnpm --dir apps/extension …` calling the scripts in this package’s **`package.json`**.

## Public site

The [Open source](https://i18nprune.dev/opensource) page should link to **`maintainer/phases/extension/README.md`** (same hub as above).
