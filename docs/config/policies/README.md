# Policies (`policies` in config)

The config schema includes optional **`policies`** so sync / quality / fill can respect **copy** and **exclusion** rules without ad-hoc flags everywhere.

## Defaults

`DEFAULT_CONFIG` in the tool includes **`policies: {}`** — an **empty object** means “no extra rules”; it is **not** the same as disabling features. Commands interpret missing keys as “no preserve list” / “no parity exclusions”.

## `policies.preserve`

Used by **`sync`** (and related) so certain keys or prefixes **stay** in target locales even when absent from the source template (e.g. extra keys you still ship outside the template).

- **`copyKeys`** — exact paths to keep
- **`copyPrefixes`** — path prefixes to keep

## `policies.parity`

Used by **`quality`**, **`fill`**, **`review`**-style checks for “still English?” / drift — **exclude** keys or values from those heuristics when you know they are expected to match English.

- **`excludeKeys`**, **`excludePrefixes`**, **`excludeValues`**

## Why the example file lists empty `preserve` / `parity`

The **`i18nprune.config.ts.example`** uses:

```ts
policies: {
  preserve: {},
  parity: {},
},
```

so new projects see **where** to add rules. You can omit nested keys or use `policies: {}` until you need them — `defineConfig` merges with defaults either way.
