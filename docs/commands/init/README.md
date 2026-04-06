# `init`

Creates **`i18nprune.config.ts`** (or **`.mts` / `.js` / `.mjs`**) when missing — interactive unless **`--yes`** (global).

If a config file is **already** present (any supported name), the command **prints an info line** and does not overwrite anything.

- **Global flags:** `--yes` writes a default **`.ts`** config without prompts when no file exists.
- Config must be **TypeScript or JavaScript** (`.ts`, `.mts`, `.js`, `.mjs`, `.cjs` supported for discovery); **JSON config files are not supported**.
- See also [config](../config/README.md).
