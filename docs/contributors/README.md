# Contributing to i18nprune

Thanks for helping improve **i18nprune**. This page describes **how we work in the repository**—structure, expectations, and where to read next. The project is **MIT licensed** and open to contributions from individuals, teams, and **automation** (CI, internal scripts, **AI-assisted coding agents**).

---

## Repository pattern

| Layer | Location | Responsibility |
|----------|----------|----------------|
| **CLI entry** | `packages/cli/bin/cli.ts` | Commander, global flags, `preAction`, command registration. |
| **Commands** | `packages/cli/src/commands/<name>/` | Orchestration only—call `@i18nprune/core`, config helpers, utils. |
| **Engine** | `packages/core/` | Domain logic: `runXxx`, cache, extractor, share, translator, locales. |
| **Config** | `packages/core/src/config/` + CLI loaders | Zod schema, `defineConfig`, path resolution. |
| **Report schema** | `packages/report/` | `ProjectReportDocument` (Zod). |
| **Docs** | `docs/` | VitePress-ready markdown; run **`pnpm docs:sync`** after substantive edits. |

**Conventions:** ESM with **`.js`** suffix in TypeScript import paths (see `tsconfig`), **`I18nPruneError`** for user-facing failures, **`logger`** gates via **`canEmit`**—never bypass policy for “just this once.”

**Type placement rule:** public contracts live in **`packages/core/src/types/<domain>/`**; CLI command types under **`packages/cli/src/types/`**.

---

## Human contributors

1. **Open an issue** (or discuss in an existing one) for significant behavior changes.
2. **Branch** from the default branch; keep commits **focused** (see below).
3. **Run** `pnpm typecheck` and `pnpm test` before opening a PR (CI runs parity tests too).
4. **Document** user-visible behavior: update **`docs/commands/<name>/README.md`** when you change a command.

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

- [Workflow](../workflow/README.md) — local commands
- [Roadmap](../roadmap/README.md) — product direction
