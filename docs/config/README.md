---
description: i18nprune reads a single project config file that defines source locale JSON, locales directory, source scan root, and translation function names (functions).
---

# Configuration

i18nprune reads a single project config file that defines **source locale JSON**, **locales directory**, **source scan root**, and **translation function names** (`functions`).

`i18nprune init` scaffolds this file and writes the same schema shape that the CLI validates at runtime. Use [`init`](../commands/init.md) when starting a new project config.

## File formats

| Priority | File | Notes |
|----------|------|--------|
| 1 | `i18nprune.config.ts` | **Recommended** — type-safe with **`defineConfig`** + **`I18nPruneConfig`** from **`i18nprune/core/config`** (see **`satisfies Partial<I18nPruneConfig>`** in **`i18nprune init`** output). |
| 2 | `i18nprune.config.js` | **Fallback** — plain ESM `export default` works; no TypeScript required. |
| 3+ | `.mts`, `.mjs`, `.cts`, `.cjs` | Supported; same merged shape after load. |

If **multiple** config files exist in the project root, the CLI resolves them in the order above (see `CONFIG_FILE_NAMES` in the source) or asks you to pick one interactively; in CI / `--json` / non-TTY, you must pass **`--config <path>`** or remove extras.

**JSON-only config files are not supported** — use TS/JS so defaults and `defineConfig` can merge safely.

## Public helpers (npm)

- **`defineConfig(partial)`** — **`i18nprune/core/config`** merges your partial with **defaults** (including **`policies`**, **`reference`**, **`missing`**). Pair with **`satisfies Partial<I18nPruneConfig>`** for editor checks.
- Types: **`I18nPruneConfig`**, **`Policies`**, etc., exported from the same subpath.

## Merge order

Resolved values follow: **defaults → config file → `I18NPRUNE_*` env → discovery (gaps only) → global CLI flags**. See [CLI runtime](../cli/runtime/README.md) and `config` command.

Canonical env var **names** are defined in **`packages/cli/src/constants/env.ts`**; human-readable tables live in [Environment variables](./env.md).

## Topics

- [Translation (`translate`)](./translate.md) — **`translate.{ primary, providers, policy }`** for **`generate`** (including **`--resume`**), precedence with CLI + env.
- [Environment variables](./env.md) — full list (`I18NPRUNE_*`, `CI`, …) and **`constants/env.ts`**.
- [Locales config](./locales.md) — locale source/directory/layout fields and links to filesystem examples.
- [Cache config](./cache.md) — cache policy block and CLI cache flags.
- [Patching config](./patching.md) — patching block and recipe-related config fields.
- [Policies](./policies.md) — `preserve` and `parity` (sync, quality, **`generate --resume`**).
- [Exclude](./exclude.md) — scan scope control (`preset`, `dirs/files/extensions/patterns`, CLI merge).

## Troubleshooting

### `Cannot find module 'i18nprune/core'`

The CLI loads your config file with **jiti** in the **project directory** (where the config lives). Any `import` inside that file is resolved like normal Node resolution from that project’s **`node_modules`**.

So if `i18nprune.config.ts` contains `import { defineConfig, type I18nPruneConfig } from 'i18nprune/core/config'`, the project must **depend on** the **`i18nprune`** npm package (or a workspace link) in **`devDependencies`** so Node can resolve that subpath. A globally installed `i18nprune` binary does **not** automatically satisfy imports inside your config file. For engine-only consumers, **`@i18nprune/core`** is available as a separate package (runtime APIs); config typing lives on **`i18nprune/core/config`** from the same **`i18nprune`** package.

**Fix:** add the package to the app and install:

```bash
npm add -D i18nprune
```

**Alternative:** use plain `i18nprune.config.ts` without importing `defineConfig` — export a plain object that matches the merged shape (still validated with **Zod** after load). See the `.js` config style in the table above.

### Custom config path

Use **`-c`** or **`--config`** with a path to a single config file (e.g. `i18nprune -c ./config/i18nprune.config.ts validate`). The same resolution rules apply: imports in that file resolve from the **project** where you run the command.

**Global `--json` and missing config:** Commands that run the implicit config bootstrap will not prompt for a filename in the terminal; they behave like **`--yes`** for the default file (see [CLI prompts](../cli/prompts.md)). Prefer an explicit **`-c` / `--config`** or a single **`i18nprune.config.*`** in the project root if you do not want a new file.

If you pass **`-c` / `--config`** and the path **does not exist**, is **not a regular file**, or has an **unsupported extension** (only `.ts`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`), the CLI **exits with code 1** and prints which **`i18nprune.config.*` files were discovered** in the current directory (if any), so you can **omit the flag** to use a standard config or fix the path.

## Validation

After merge with defaults, the loaded object is checked with **Zod** (`packages/cli/src/config/schema.ts`) — invalid types or missing required fields produce a clear validation error.
