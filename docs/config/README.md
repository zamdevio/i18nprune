# Configuration

i18nprune reads a single project config file that defines **source locale JSON**, **locales directory**, **source scan root**, and **translation function names** (`functions`).

## File formats

| Priority | File | Notes |
|----------|------|--------|
| 1 | `i18nprune.config.ts` | **Recommended** — type-safe with `defineConfig` from `@zamdevio/i18nprune/config`. |
| 2 | `i18nprune.config.js` | **Fallback** — plain ESM `export default` works; no TypeScript required. |
| 3+ | `.mts`, `.mjs`, `.cts`, `.cjs` | Supported; same merged shape after load. |

If **multiple** config files exist in the project root, the CLI resolves them in the order above (see `CONFIG_FILE_NAMES` in the source) or asks you to pick one interactively; in CI / `--json` / non-TTY, you must pass **`--config <path>`** or remove extras.

**JSON-only config files are not supported** — use TS/JS so defaults and `defineConfig` can merge safely.

## Public helpers (npm)

- **`defineConfig(partial)`** — `@zamdevio/i18nprune/config` merges your partial with **defaults** (including empty `policies: {}`).
- Types: **`I18nPruneConfig`**, **`Policies`**, etc., exported from the same subpath.

## Merge order

Resolved values follow: **defaults → config file → command-specific env (e.g. `MISSING_DISPLAY_DEFAULT_TOP`) → `I18NPRUNE_*` env → discovery (gaps only) → global CLI flags**. See [CLI runtime](../cli/runtime/README.md) and `config` command.

Canonical env var **names** are defined in **`packages/cli/src/constants/env.ts`**; human-readable tables live in [Environment variables](./env.md).

## Topics

- [Environment variables](./env.md) — full list (`I18NPRUNE_*`, `CI`, `MISSING_DISPLAY_DEFAULT_TOP`, …) and **`constants/env.ts`**.
- [Command namespaces](./commands.md) — `validate`, `missing`, and config-shaped guidance.
- [Policies](./policies/README.md) — `preserve` and `parity` (sync, quality, fill).

## Troubleshooting

### `Cannot find module '@zamdevio/i18nprune/config'`

The CLI loads your config file with **jiti** in the **project directory** (where the config lives). Any `import` inside that file is resolved like normal Node resolution from that project’s **`node_modules`**.

So if `i18nprune.config.ts` contains `import { defineConfig } from '@zamdevio/i18nprune/config'`, the project must **depend on** the same package that provides the CLI (e.g. **`@zamdevio/i18nprune`** in `devDependencies`). A globally installed `i18nprune` binary does **not** automatically satisfy imports inside your config file.

**Fix:** add the package to the app and install:

```bash
npm add -D @zamdevio/i18nprune
```

**Alternative:** use plain `i18nprune.config.ts` without importing `defineConfig` — export a plain object that matches the merged shape (still validated with **Zod** after load). See the `.js` config style in the table above.

### Custom config path

Use **`-c`** or **`--config`** with a path to a single config file (e.g. `i18nprune -c ./config/i18nprune.config.ts validate`). The same resolution rules apply: imports in that file resolve from the **project** where you run the command.

**Global `--json` and missing config:** Commands that run the implicit config bootstrap will not prompt for a filename in the terminal; they behave like **`--yes`** for the default file (see [behavior: non-interactive](../behavior/README.md)). Prefer an explicit **`-c` / `--config`** or a single **`i18nprune.config.*`** in the project root if you do not want a new file.

If you pass **`-c` / `--config`** and the path **does not exist**, is **not a regular file**, or has an **unsupported extension** (only `.ts`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`), the CLI **exits with code 1** and prints which **`i18nprune.config.*` files were discovered** in the current directory (if any), so you can **omit the flag** to use a standard config or fix the path.

## Validation

After merge with defaults, the loaded object is checked with **Zod** (`packages/cli/src/config/schema.ts`) — invalid types or missing required fields produce a clear validation error.
