# Policies (`policies` in config)

The config schema includes optional **`policies`** so sync / quality / fill can respect **copy** and **exclusion** rules without ad-hoc flags everywhere.

## Who applies what (vs `exclude`)

| knob | Applied by | Effect |
| --- | --- | --- |
| **`exclude`** (top-level scan config) | **Scanner / validate / cleanup** pipelines that decide **which files and code** participate in discovery | Shrinks **where** keys can be referenced or reported — it is **not** a per-key translator rule inside locale JSON |
| **`policies.preserve`** | **`sync`**, merges, cleanup/fill flows that honor **`reference.defaults.respectPreserve`** | Keys/prefixes that should **stay** in targets when merging from source (regions, legal blobs, intentional extras) |
| **`policies.parity`** | **`quality`**, **`fill`**, **review-style** checks (e.g. source-identical leaves) | Excludes paths or values **only from those heuristic checks**, not from scanning or sync |

So **`parity` is not a duplicate of `exclude`**: `exclude` limits **sources** scanned; **`parity`** only suppresses noisy **quality signals** where matching the **source** locale is expected (brand strings, placeholders, experimental keys, etc.). **`preserve`** is about **merge behavior**, not ignoring files during scan.

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
