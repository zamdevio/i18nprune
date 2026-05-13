# Agents & contributors

Guides for humans and coding agents working in this repo.

| Page | What it covers |
|------|----------------|
| [**Architecture**](./architecture.md) | Package topology, core purity, `runXxx` pattern, type/barrel layout, import discipline, health gates (knip/madge), cross-surface parity |
| [**Rules**](./rules.md) | TypeScript, output contract, error handling, testing, logging, non-interactive safety, commit discipline |
| [**JSDoc**](./jsdoc.md) | When/where/how to write JSDoc across core, CLI, and apps |
| [**Git**](./git.md) | Commit style, bundling rules, Conventional Commits, pre-push checklist |

## Onboarding (first steps)

1. Read [`architecture.md`](./architecture.md) and [`rules.md`](./rules.md).
2. Run `pnpm install`, `pnpm typecheck`, `pnpm test`.
3. Skim `packages/cli/bin/cli.ts` and one command end-to-end (e.g. `packages/cli/src/commands/validate/`).
4. Check the active sprint: `maintainer/phases/active-phase.md`.
5. Follow [`git.md`](./git.md) for commit hygiene.

## Docs site (VitePress)

`docs/` is synced into `apps/docs/content/`. When adding, renaming, or removing a markdown page that should appear in the nav, update `apps/docs/.vitepress/sidebar.ts` in the same change.

## Where things live

| Need | Location |
|------|----------|
| Active plans | `maintainer/phases/` |
| Shipped receipts | `maintainer/phases/shipped-slices.md` |
| System maps | `maintainer/systems/` |
| Scratch / spikes | `maintainer/temp/` (gitignored) |
| User-facing docs | `docs/` |
