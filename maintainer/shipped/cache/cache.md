# Cache engine (2026-W20–W21)

## W20

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **Translate-cache (H.1)** | L1 memo + L2 `translations/<code>.json` | [`cli/cache`](../../../docs/cli/cache.md) |
| **Cache index** | `localeSegments` in `files.json`; drop `snapshot.json` | [`systems/cache.md`](../../systems/cache.md) |
| **Cache incremental** | src delta patch, `cache.rebuild`, `--debug-cache` | [`cli/cache`](../../../docs/cli/cache.md) |

## W21

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **Cache profiles** | safe/balanced/fast, `--cache-profile` | [`cli/cache`](../../../docs/cli/cache.md) |
| **Cache locale-aware rebuild** | Target-only reuse, leaf-based missing keys | [`systems/cache.md`](../../systems/cache.md) |

**Related:** generate engine → [`generate.md`](./generate.md) · init/locales → [`init.md`](./init.md)
