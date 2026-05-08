# Contributing to i18nprune

Thanks for helping improve **i18nprune**. This page describes **how we work in the repository**—structure, expectations, and where to read next. The project is **MIT licensed** and open to contributions from individuals, teams, and **automation** (CI, internal scripts, **AI-assisted coding agents**).

---

## Repository pattern

| Layer | Location | Responsibility |
|----------|----------|----------------|
| **CLI entry** | `packages/cli/bin/cli.ts` | Commander, global flags, `preAction`, command registration. |
| **Commands** | `packages/cli/src/commands/<name>/` | Orchestration only—call `core/`, `config/`, `utils/`. |
| **Core** | `packages/cli/src/core/` | Domain logic: context, JSON, extractor, scanner, languages, translator, errors. |
| **Config** | `packages/cli/src/config/` | Load, validate, resolve paths, `defineConfig`. |
| **Types** | `packages/cli/src/types/` | Shared TypeScript contracts. |
| **Utils** | `packages/cli/src/utils/` | Logger, fs, rg, CLI helpers, report writer. |
| **Exports** | `packages/cli/src/exports/` | Published **`i18nprune/core`** and **`/core`**. |
| **Docs** | `docs/` | VitePress-ready markdown; run **`pnpm docs:sync`** after substantive edits. |

**Conventions:** ESM with **`.js`** suffix in TypeScript import paths (see `tsconfig`), **`I18nPruneError`** for user-facing failures, **`logger`** gates via **`canEmit`**—never bypass policy for “just this once.”

**Type placement rule:** exported/shared type contracts belong in **`packages/cli/src/types/**`** (with barrel re-exports) and runtime modules should import them with `import type` rather than owning exported type declarations.

---

## Human contributors

1. **Open an issue** (or discuss in an existing one) for significant behavior changes.
2. **Branch** from the default branch; keep commits **focused** (see below).
3. **Run** `pnpm typecheck` and `pnpm test` before opening a PR.
4. **Document** user-visible behavior: update **`docs/commands/<name>/README.md`** when you change a command.

---

## AI agents & pair-programming

Many contributors use **IDE assistants** or **batch agents** for refactors and docs. The same rules apply: **small commits**, **tests**, and **docs with code**.

**👉 Agent guide (repo-only):** see `maintainer/agents/README.md` — project analysis, Git slicing/commit discipline, rules, logging, and extraction notes. (The docs site only hosts `docs/**`, so these maintainer notes are not linked here.)

Whether you type every line yourself or use an agent, **the merge bar is the same**: correct types, tests green, docs aligned.

---

## Git history

We prefer **Conventional Commits** and **coherent slices** (e.g. one command + its `docs/commands/...` page). See `maintainer/agents/git.md` for the ordered commit plan (repo-only).

---

## Code of conduct

Be respectful in issues and reviews. Technical disagreement is expected; harassment is not.

---

## See also

- [Workflow](../workflow/README.md) — local commands
- [Roadmap](../roadmap/README.md) — product direction
- [Exports](../exports/README.md) — programmatic API
