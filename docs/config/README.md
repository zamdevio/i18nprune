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

Resolved values follow: **defaults → config file → `I18NPRUNE_*` env → discovery (gaps only) → global CLI flags**. See [CLI runtime](../cli/runtime/README.md) and `config` command.

## Topics

- [Policies](./policies/README.md) — `preserve` and `parity` (sync, quality, fill).
