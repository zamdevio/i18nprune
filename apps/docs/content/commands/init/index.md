# `init`

**Full examples:** [init examples](../../examples/commands/init)

Creates **`i18nprune.config.ts`** (or **`.mts` / `.js` / `.mjs`**) when missing — interactive unless **`--yes`** (global).

Scaffolded files import **`defineConfig`** and **`I18nPruneConfig`** from **`i18nprune/config`** and end with **`satisfies Partial<I18nPruneConfig>`** so the editor type-checks your object literal against the same shape the CLI validates (after load, the loader still merges defaults and runs Zod).

If a config file is **already** present (any supported name), the command **prints an info line** and does not overwrite anything.

- **`--rich`:** expanded starter: **`patching`**, **`scanner`**, **`output`**, **`policies`**, **`reference`** (defaults + commented guidance for optional **`commands`**, no inlined per-command blobs), **`localeLeaves`**, **`missing`**, **`translate`** (Google row live; other backends **commented** with **`contactEmail`**, **`baseUrl`**, **`apiKey`**, LLM triple + env patterns; **`policy`** + example **`rateLimit`** on Google), **`noLocaleMeta`**, etc. (**`i18nprune validate`** is flag-driven — there is no **`config.validate`** blob today; see **[command namespaces](../config/commands.md)**.)
- **Global flags:** **`--yes`** writes minimal config: **`translate`** = Google + **commented** stubs for other backends, **`policy`**, **`workers: 1`**. Combine **`--yes --rich`** for the annotated **`rateLimit`** template.
- Config must be **TypeScript or JavaScript** (`.ts`, `.mts`, `.js`, `.mjs`, `.cjs` supported for discovery); **JSON config files are not supported**.
- See also [config](../config).
