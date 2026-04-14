# Ripgrep string presence

[← Back to regex overview](./README.md)

## Role

Ripgrep (**`rg`**) is used as a **secondary** signal: it searches for the **locale string value** (or key fallback) under **`src/`** with **fixed strings** (`--fixed-strings`). It does **not** prove that a **key path** is still referenced in code; it only proves that **some substring** of the translation text appears somewhere in source (or docs, comments in source files, tests, etc.).

## `reference.stringPresence`

| Value | Behavior in cleanup |
|--------|---------------------|
| **`guard`** | If `rg` finds the text, the key is **not** removed (conservative default). Locations can be logged using **`rg --json`**-derived `file:line` (see `rgFixedStringSearchLocations`). |
| **`warn`** | Log hit locations when present; **removal may still proceed** — use only when you accept false negatives. |
| **`off`** | Do not run `rg` (fastest; relies on static + uncertain-prefix logic only). |

Configure under **`reference.defaults`** and override per command in **`reference.commands.cleanup`**.

## CLI flags

- **`cleanup --skip-rg`** — skip ripgrep regardless of `stringPresence` (same as unavailable `rg` binary for the removal gate when `stringPresence` is not `off`).

## Implementation

- Boolean hit: `packages/cli/src/utils/rg/index.ts` — `rgFixedStringSearch`.
- Structured hits: `rgFixedStringSearchLocations` — parses **`rg --json`** match lines for paths and line numbers.
