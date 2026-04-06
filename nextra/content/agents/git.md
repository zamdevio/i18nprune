# Git history hygiene (for humans & coding agents)

This repository uses **small, coherent commits** so history is reviewable, bisect-friendly, and each change maps to one concern. **Agents should follow this method** whenever they introduce or change features.

## Principles

1. **One concern per commit** — A commit touches one *vertical slice* (e.g. one command + its user-facing doc) or one *horizontal layer* (e.g. logger policy only) — not unrelated refactors mixed with features.
2. **Code + docs together** — When you add or change a CLI command, include **`docs/commands/<slug>/README.md`** (and **`docs/commands/README.md`** index row if new) in the **same commit** as the implementation. Users and the docs site stay aligned.
3. **Tests with the feature** — Unit tests for a module ship with that module’s commit. Integration tests that cover several commands can land in a dedicated **`test:`** commit after the commands exist, or with the last command they need.
4. **Messages** — Prefer [Conventional Commits](https://www.conventionalcommits.org/): `feat(validate): …`, `fix(sync): …`, `docs(generate): …`, `chore: …`, `test: …`, `refactor(core): …`.
5. **No drive-by churn** — Do not reformat unrelated files or rename symbols outside the stated scope of the commit.

## What to bundle

| Change type | Include in the same commit |
|-------------|----------------------------|
| New / updated command | `src/commands/...`, `src/types/command/...` if any, `bin/cli.ts` registration lines for that command, `docs/commands/.../README.md`, `src/utils/cli/banner.ts` / `src/constants/docs.ts` if new slug |
| Global CLI flag | `bin/cli.ts`, `src/core/context/*` or `src/core/runtime/*`, `docs/cli/*` or `docs/behavior/*` as appropriate |
| Config field | `src/config/schema.ts`, `src/types/config/*`, `i18nprune.config.ts.example`, `docs/config/*` |
| Report / output contract | `src/utils/report/*`, consumers, `docs/commands/report/README.md` |

## `bin/cli.ts`

The CLI entry registers **all** commands in one file. Options:

- **Incremental history:** Each command commit adds **only** the `program.command(...)` block (and shared `preAction` updates) needed for that command. Final commits still touch `bin/cli.ts` often — that is acceptable.
- **Single wiring commit:** Implement commands in separate commits **without** registering them, then one commit **`feat(cli): register <list> commands`** — only works if you tolerate temporary dead code or feature branches; usually **not** preferred on `main`.

**Preferred:** Register each command in the **same commit** as its implementation so the tree always runs.

## Proposed commit plan (fresh `git init`)

Use this order after **`git init`** (or to **reconstruct** a clean history from a single working tree). Adjust paths if your tree differs. **Do not** treat this as a one-shot script — run commits **one at a time** and verify `pnpm typecheck` / `pnpm test` where noted.

### Layer 0 — Repository metadata

1. **`chore: add package metadata and build tooling`**  
   `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `.gitignore`, `LICENSE`, `README.md` (minimal stub without agent section if you prefer a later docs commit).

### Layer 1 — Types & constants

2. **`feat(types): add shared command and config types`** — `src/types/**` (excluding command-specific folders until those commands exist, or add all `src/types` if already present).  
3. **`feat(constants): add CLI and docs URL constants`** — `src/constants/**`.

### Layer 2 — Config & context

4. **`feat(config): schema, load, resolve, and defineConfig export`** — `src/config/**`, `src/exports/config.ts`, `i18nprune.config.ts.example`.  
5. **`feat(core): context, runtime options, errors, globals`** — `src/core/context/**`, `src/core/runtime/**`, `src/core/errors/**`, `src/core/context/globals.ts` (or equivalent).

### Layer 3 — Domain core (shared)

6. **`feat(core): JSON path, merge, prune, leaves`** — `src/core/json/**`.  
7. **`feat(core): languages catalog and normalization`** — `src/core/languages/**`.  
8. **`feat(core): extractor, scanner, dynamic key heuristics`** — `src/core/extractor/**`, `src/core/scanner/**`, `src/core/dynamic/**`, `src/core/constmap/**` if present.  
9. **`feat(core): translator, progress, parity helpers`** — `src/core/translator/**`, `src/core/progress/**`, `src/core/parity/**`, `src/providers/**`.

### Layer 4 — Utilities & CLI infrastructure

10. **`feat(utils): fs, rg, ansi, style, width, interactive`** — `src/utils/fs`, `src/utils/rg`, `src/utils/ansi`, `src/utils/style`, `src/utils/width`, `src/utils/interactive`, etc.  
11. **`feat(cli): logger policy and logger`** — `src/utils/logger/**`, `src/types/core/logger/**`.  
12. **`feat(cli): argv preprocessing and help styling`** — `src/argv/**`, `src/commands/help/**`, `src/utils/help/**`, `src/utils/cli/path.ts`, `src/utils/cli/banner.ts`.  
13. **`feat(cli): locale args helpers`** — `src/utils/cli/args.ts`, `src/utils/cli/__tests__/args.test.ts`.  
14. **`feat(utils): structured report file writer`** — `src/utils/report/**`, `src/core/context/report.ts`, `src/utils/report/types.ts`.

### Layer 5 — Commands (each: implementation + types + docs + `bin` slice)

For **each** row, include the matching **`docs/commands/.../README.md`** and the **`bin/cli.ts`** block that registers the command (and `locales` subcommands as you add them).

15. **`feat(init): init command`** — `src/commands/init/**` or `src/config/init/**`, `docs/commands/init/README.md`, `bin/cli.ts`.  
16. **`feat(config): config command`** — `src/commands/config/**`, `docs/commands/config/README.md`, `bin/cli.ts`.  
17. **`feat(validate): validate command`** — `src/commands/validate/**`, `src/types/command/validate/**`, `docs/commands/validate/README.md`, `bin/cli.ts`.  
18. **`feat(sync): sync command and human summary`** — `src/commands/sync/**`, `src/types/command/sync/**`, `docs/commands/sync/README.md`, `bin/cli.ts`.  
19. **`feat(generate): generate command and prompts`** — `src/commands/generate/**`, `src/types/command/generate/**`, `docs/commands/generate/README.md`, `bin/cli.ts`.  
20. **`feat(fill): fill command`** — `src/commands/fill/**`, `src/types/command/fill/**`, `docs/commands/fill/README.md`, `bin/cli.ts`.  
21. **`feat(quality): quality command`** — `src/commands/quality/**`, `src/types/command/quality/**`, `docs/commands/quality/README.md`, `bin/cli.ts`.  
22. **`feat(review): review command`** — `src/commands/review/**`, `src/types/command/review/**`, `docs/commands/review/README.md`, `bin/cli.ts`.  
23. **`feat(cleanup): cleanup command`** — `src/commands/cleanup/**`, `src/types/command/cleanup/**`, `docs/commands/cleanup/README.md`, `bin/cli.ts`.  
24. **`feat(languages): languages command`** — `src/commands/languages/**`, `docs/commands/languages/README.md`, `bin/cli.ts`.  
25. **`feat(locales): locales list, edit, dynamic, delete`** — `src/commands/locales/**`, `docs/commands/locales/README.md`, `docs/commands/locales/list|edit|dynamic|delete/README.md`, `bin/cli.ts`.  
26. **`feat(report): report help topic`** — `src/commands/report/**`, `docs/commands/report/README.md`, `bin/cli.ts`.  
27. **`feat(doctor): doctor command`** — `src/commands/doctor/**`, `docs/commands/doctor/README.md`, `bin/cli.ts`.  
28. **`feat(help): help command`** — `src/commands/help/**`, `docs/commands/help/README.md`, `bin/cli.ts`.

### Layer 6 — Exports, tests, docs site

29. **`feat(exports): add core library export`** — `src/exports/core.ts`, `src/core/**` public surface if split.  
30. **`test: add integration and config tests`** — `tests/**`, `src/**/__tests__/**` not already committed.  
31. **`docs: command index and cross-links`** — `docs/commands/README.md`, `docs/behavior/commands.md`, `docs/README.md`, `docs/roadmap/README.md`, etc.  
32. **`chore(nextra): sync script and site assets`** — `nextra/scripts/sync-content.js`, `nextra/**` as tracked (exclude `node_modules`, `.next`), document `pnpm docs:sync`.  
33. **`docs(agents): contributor and agent guides`** — `docs/agents/**`, links from root `README.md` and `docs/README.md`.

### Optional final polish

34. **`chore: scripts and fixture app`** — `scripts/**`, `tests/fixtures/**` if kept separate.

---

## After `.git` was removed

If history was discarded on purpose, run **`git init`**, then apply the plan above in order. First commit should establish **`main`** (or your default branch name):

```bash
git init -b main
git add <files-for-commit-1>
git commit -m "chore: add package metadata and build tooling"
# …repeat
```

## Checklist before pushing

- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm run build`
- [ ] If docs changed: `pnpm docs:sync` and commit **`nextra/content`** if your workflow tracks it

---

*See also: [Analysis](./analysis.md) for project structure and [Contributors README](./README.md).*
