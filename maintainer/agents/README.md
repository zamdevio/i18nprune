# Contributors & coding agents

Helper docs for humans and **coding agents** working in this repo: architecture map, Git discipline, and implementation rules.

| Page | Topic |
|------|-------|
| [Analysis](./analysis.md) | **Start here** — full project map, layers, commands, tests, extension points |
| [Git](./git.md) | **Commit plan** — how to slice commits (command + docs together); Conventional Commits |
| [Vision](./vision.md) | Goals and constraints |
| [Patterns](./patterns.md) | Core architecture and extension patterns |
| [Rules](./rules.md) | TypeScript, CLI, tests |
| [Logging](./logging.md) | `logger` + policy |
| [Extraction](./extraction.md) | Literal key extraction |

Run **`pnpm typecheck`** and **`pnpm test`** before large changes. For a fresh repository history, follow the ordered plan in **[git.md](./git.md)**.

**Contributor sequencing:** see **`maintainer/README.md`** (repo root). **Temporary plans and scratch** go in **`maintainer/temp/`** (**gitignored** — not in git history; look on disk locally when the user references WIP there).

## Docs site (VitePress)

Root **`docs/`** is synced into **`apps/docs/content/`**. When you **add, rename, or remove** a Markdown page that should appear in the left nav, update **`apps/docs/.vitepress/sidebar.ts`** in the same change (see the **Issues reference** group for per-topic issue pages). Forgetting this leaves new pages reachable only by URL or search.
