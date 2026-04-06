# Development workflow

From the **repository root**:

| Command | Purpose |
|--------|---------|
| `pnpm install` | Install dependencies |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm build` | `tsup` → `dist/` (run before **`pnpm test`** if you use integration tests that execute **`dist/cli.js`**) |
| `pnpm dev -- --help` | Run CLI via `tsx` |
| `pnpm generate:languages` | Regenerate `languages.json` |
| `pnpm docs:sync` | Copy `docs/` → `nextra/content/` |
| `pnpm docs:dev` | Nextra dev server |
| `pnpm docs:build` | Static export |

Authoritative docs live under **`docs/`**; sync before previewing the site.
