# `init`

Creates **`i18nprune.config.ts`** (or **`.mts` / `.js` / `.mjs`**) when missing — interactive unless **`--yes`** (global).

Scaffolded files import **`defineConfig`** and **`I18nPruneConfig`** from **`i18nprune/core/config`** and end with **`satisfies Partial<I18nPruneConfig>`** so the editor type-checks your object literal against the same shape the CLI validates (after load, the loader still merges defaults and runs Zod).

If a config file is **already** present (any supported name), the command **prints an info line** and does not overwrite anything.

- **`--rich`:** expanded starter: **`patching`**, **`scanner`**, **`output`**, **`policies`**, **`reference`**, **`localeLeaves`**, **`missing`**, **`translate`** (Google row live; other backends **commented** with **`contactEmail`**, **`baseUrl`**, **`apiKey`**, LLM triple + env patterns; **`policy`** + example **`rateLimit`** on Google), etc. (**`i18nprune validate`** is flag-driven — there is no **`config.validate`** namespace today; see [config](../config/README.md).)
- **Global flags:** **`--yes`** writes minimal config: **`translate`** = Google + **commented** stubs for other backends, **`policy`**, **`workers: 1`**. Combine **`--yes --rich`** for the annotated **`rateLimit`** template.
- Config must be **TypeScript or JavaScript** (`.ts`, `.mts`, `.js`, `.mjs`, `.cjs` supported for discovery); **JSON config files are not supported**.
- See also [config](../config/README.md).

## Examples

```bash
i18nprune init
i18nprune init --yes
i18nprune init --yes --rich
```

```bash
# confirm resolved config path
i18nprune config --json | jq '.data.resolvedConfigPath'
```
