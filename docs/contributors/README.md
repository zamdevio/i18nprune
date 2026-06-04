# Contributing to i18nprune

Thanks for helping improve **i18nprune**. This page describes **how we work in the repository**—structure, expectations, and where to read next. The project is **MIT licensed** and open to contributions from individuals, teams, and **automation** (CI, internal scripts, **AI-assisted coding agents**).

---

## New to the codebase?
If you are new (or you are letting an AI agent drive a small change), start with this Day 0 reading order:

1. `maintainer/agents/architecture.md` (package topology and where behavior lives)
2. `maintainer/agents/rules.md` (TypeScript conventions, errors, logging, tests)
3. `maintainer/agents/git.md` (commit and PR discipline)
4. `maintainer/phases/active-phase.md` (what is actively being worked on right now)
5. `maintainer/phases/shipped-slices.md` (avoid re-implementing closed work)
6. `maintainer/systems/README.md` (where the subsystem maps live)
7. `maintainer/systems/platform.md` (multi-OS behavior and path pitfalls)
8. `maintainer/systems/operations/entrypoints.md` (the `runXxx` wiring table)
9. `packages/cli/bin/cli.ts` (global flags + command registration)
10. Trace one command end-to-end (a CLI `packages/cli/src/commands/<name>/` flow into `packages/core/src/<op>/run.ts`)
11. `maintainer/systems/health.md` (the gates you must keep green before a PR)

Then run:
`pnpm typecheck` and `pnpm test`.

## Repository pattern

| Layer | Location | Responsibility |
|----------|----------|----------------|
| **CLI entry** | `packages/cli/bin/cli.ts` | Commander, global flags, `preAction`, command registration. |
| **Commands** | `packages/cli/src/commands/<name>/` | Orchestration only—call `@i18nprune/core`, config helpers, utils. |
| **Engine** | `packages/core/` | Domain logic: `runXxx`, cache, extractor, share, translator, locales. |
| **Config** | `packages/core/src/config/` + CLI loaders | Zod schema, `defineConfig`, path resolution. |
| **Report schema** | `packages/core/src/shared/report/` | `ProjectReportDocument` (Zod); import `@i18nprune/core/report-schema`. |
| **Docs** | `docs/` | VitePress-ready markdown; run **`pnpm docs:sync`** after substantive edits. |

**Conventions:** ESM with **`.js`** suffix in TypeScript import paths (see `tsconfig`), **`I18nPruneError`** for user-facing failures, **`logger`** gates via **`canEmit`**—never bypass policy for “just this once.”

**Type placement rule:** public contracts live in **`packages/core/src/types/<domain>/`**; CLI command types under **`packages/cli/src/types/`**.

---

## Human contributors

1. **Open an issue** (or discuss in an existing one) for significant behavior changes.
2. **Branch** from the default branch; keep commits **focused** (see below).
3. **Run** `pnpm typecheck` and `pnpm test` before opening a PR (CI runs parity tests too).
4. **Document** user-visible behavior: update **`docs/commands/<name>.md`** (or `share`/`locales` pages) when you change a command.

**Repo layout (clone only — not on the public docs site):** `maintainer/agents/onboarding.md` — reading order, root scripts, share/core boundaries, PR checklist.  
[View onboarding on GitHub](https://github.com/zamdevio/i18nprune/blob/main/maintainer/agents/onboarding.md)

---

## AI agents & pair-programming

Many contributors use **IDE assistants** or **batch agents** for refactors and docs. The same rules apply: **small commits**, **tests**, and **docs with code**.

**Contributor & agent hub (repo clone):** `maintainer/agents/README.md` — architecture, rules, Git discipline, onboarding.  
[View agents README on GitHub](https://github.com/zamdevio/i18nprune/blob/main/maintainer/agents/README.md)

Whether you type every line yourself or use an agent, **the merge bar is the same**: correct types, tests green, docs aligned.

---

## Git history

We prefer **Conventional Commits** and **coherent slices** (e.g. one command + its `docs/commands/...` page).  
Commit plan: `maintainer/agents/git.md` — [view on GitHub](https://github.com/zamdevio/i18nprune/blob/main/maintainer/agents/git.md) (repo-only).

---

## Code of conduct

Be respectful in issues and reviews. Technical disagreement is expected; harassment is not.

---

## See also

- [Workflow](../workflow.md) — local commands
- [Changelog](../changelog.md) — recent product direction and release notes
