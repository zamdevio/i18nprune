---
description: Cache profile and rebuild settings — reuse analysis, locale deltas, and when full rescans run.
---

# Cache config

Use the `cache` block to control scan/analysis reuse behavior.

## Core fields

- `cache.enabled`
- `cache.profile` (`safe`, `balanced`, `fast`)
- `cache.rebuild`
- `cache.fullRescanThresholdPercent`
- `cache.mode`
- `cache.dir`

## CLI flags that interact with cache

- `--no-cache`
- `--debug-cache`
- `--cache-profile <safe|balanced|fast>`

## Full disk/cache behavior

For complete cache layout, reuse policy, and platform notes, see:

- [CLI cache](../cli/cache.md)
