---
description: The config schema includes optional policies so sync, quality, and generate --resume can respect copy and exclusion rules without ad-hoc flags.
---

# Policies (`policies` in config)

The config schema includes optional `policies` so sync, quality, and `generate --resume` can respect copy and exclusion rules without ad-hoc flags.

## Who applies what (vs `exclude`)

| knob | Applied by | Effect |
| --- | --- | --- |
| `exclude` (scan config) | Scanner / validate / cleanup pipelines | Limits which source files participate in discovery. |
| `policies.preserve` | `sync`, merges, cleanup, and resume flows that respect preserve | Keys/prefixes that stay in targets, hydrate from source, and/or skip machine translation. |
| `policies.parity` | `quality`, `review`, `generate --resume` heuristics | Excludes expected matches from parity-style checks. |

## `policies.preserve`

| Field | Sync | Cleanup | `generate --resume` (when `respectPreserve`) |
|-------|------|---------|-----------------------------------------------|
| **`copyKeys`** | Exact paths stay in the sync template; hydrate from source; retain on prune | Not removed as unused | **Verbatim** — skip MT (copy source) |
| **`copyPrefixes`** | Same for any path under the prefix (e.g. `navigation.`) | Same | **Verbatim** — skip MT |
| **`uncertainPrefixes`** | Declared roots without scan anchors — hydrate + retain like auto uncertain prefixes | Protected when uncertain-key policy is `protect` / `warn_only` | **Shape** — allowed to translate (not treated as verbatim preserve) |

Trailing dots on prefixes (e.g. `navigation.`) are fine; sync normalizes them for keep matching.

### Split semantics (no rename)

- **Verbatim:** `copyKeys` / `copyPrefixes` — never machine-translate; sync keeps/hydrates from source.
- **Shape:** `uncertainPrefixes` (and auto-detected uncertain prefixes from the scan) — keep trees in locale JSON through sync; `generate --resume` may still fill them when policy allows.

Prefer declaring `uncertainPrefixes` (or `copyPrefixes` when copy must stay source-language) instead of scan-only anchor files once you are on **≥ 1.0.3**.

## `policies.parity`

- `excludeKeys`
- `excludePrefixes`
- `excludeValues`

## Why `init --rich` shows this block

`i18nprune init --rich` includes a `policies` section so teams see where preserve/parity rules belong. You can keep it empty until needed.
