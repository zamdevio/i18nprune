# Agents & contributors

Guides for humans and coding agents working in this repo.

| Page | What it covers |
|------|----------------|
| [**Architecture**](./architecture.md) | Package topology, core purity, `runXxx` pattern, type/barrel layout, import discipline, health gates, cross-surface parity |
| [**Rules**](./rules.md) | TypeScript, output contract, error handling, testing, logging, non-interactive safety, commit discipline |
| [**JSDoc**](./jsdoc.md) | When/where/how to write JSDoc across core, CLI, and apps |
| [**Git**](./git.md) | Commit style, bundling rules, Conventional Commits, pre-push checklist |
| [**Health gates**](../systems/health.md) | `typecheck`, `test`, knip, madge, `ui:purity`, `empty:*` — when to run, barrel discipline |
| [**Onboarding**](./onboarding.md) | First-day reading order, trace-a-command, PR checklist, host purity |
| [**Share ecosystem**](../systems/share.md) | Core `runShare*`, CLI/web/report, `workers/i18nprune` API |
| [**Runtime UI kit**](../systems/ui.md) | `@i18nprune/ui` domain boundaries, purity rules, enforcement |
| [**Knip config**](../systems/knip.md) | `knip.json` ignore catalog (barrels, edge entries, type-only deps) |

## Onboarding (first steps)

**→ Full guide:** [`onboarding.md`](./onboarding.md)

1. Read [`onboarding.md`](./onboarding.md) (reading order + trace-a-command).
2. Run `pnpm install`, `pnpm typecheck`, `pnpm test`.
3. Check the active sprint: `maintainer/phases/active-phase.md`.
4. Follow [`git.md`](./git.md) for commit hygiene.

## Docs site (VitePress)

`docs/` is synced into `apps/docs/content/`. When adding, renaming, or removing a markdown page that should appear in the nav, update `apps/docs/.vitepress/sidebar.ts` in the same change.

**Audience and tone:** treat `docs/**` as **end-user documentation** (public site). Prefer plain language, config- and behavior-focused explanations, and links to other `docs/` pages. Avoid maintainer roadmap language (sessions, phases, “shipped” checklists), avoid `maintainer/` paths in prose unless there is no user-safe alternative, and avoid deep internal file paths unless they genuinely help readers (otherwise point contributors to `maintainer/systems/` or the repo). Roadmaps, subsystem maps, and agent-only checklists belong under `maintainer/`.

## Where things live

| Need | Location |
|------|----------|
| Active plans | `maintainer/phases/` |
| Shipped receipts | `maintainer/phases/shipped-slices.md` |
| System maps | `maintainer/systems/` |
| Scratch / spikes | `maintainer/temp/` (gitignored) |
| User-facing docs | `docs/` |
