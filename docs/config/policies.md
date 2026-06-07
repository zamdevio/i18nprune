---
description: The config schema includes optional policies so sync, quality, and generate --resume can respect copy and exclusion rules without ad-hoc flags.
---

# Policies (`policies` in config)

The config schema includes optional `policies` so sync, quality, and `generate --resume` can respect copy and exclusion rules without ad-hoc flags.

## Who applies what (vs `exclude`)

| knob | Applied by | Effect |
| --- | --- | --- |
| `exclude` (scan config) | Scanner / validate / cleanup pipelines | Limits which source files participate in discovery. |
| `policies.preserve` | `sync`, merges, and resume flows that respect preserve | Keys/prefixes that should stay in targets during merge. |
| `policies.parity` | `quality`, `review`, `generate --resume` heuristics | Excludes expected matches from parity-style checks. |

## `policies.preserve`

- `copyKeys` — exact paths to keep
- `copyPrefixes` — prefixes to keep

## `policies.parity`

- `excludeKeys`
- `excludePrefixes`
- `excludeValues`

## Why `init --rich` shows this block

`i18nprune init --rich` includes a `policies` section so teams see where preserve/parity rules belong. You can keep it empty until needed.
