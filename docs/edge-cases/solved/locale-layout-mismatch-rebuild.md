# Locale layout mismatch rebuild

## Problem

Changing `locales.mode`, `locales.structure`, or `locales.directory` without clearing cache can leave **`files.json`** fingerprints pointing at the wrong segment set. Operators may see stale `missingKeys` or validate results until something forces a rescan.

## What we do

1. **Layout fingerprint** in `files.json` records `mode`, `structure`, `directory`, and `source`.
2. On mismatch vs live config, **`decideAnalysisRebuild`** returns **`full`** with reason **`layout_changed`** — full project scan, not a partial src patch.
3. **Partial layout recovery:** when only the fingerprint changes but src index is still usable, core may re-walk locale segments and reuse the cached `src/**` index where safe ([CLI cache](../../cli/cache.md#filesjson)).
4. **`--debug-cache`:** look for `analysis rebuild: full (...)` including layout-related reasons after config edits.

## Operator checklist

| Change | Expected cache behavior |
|--------|-------------------------|
| Rename `locales.directory` | Full rebuild on next command |
| Switch `flat_file` → `locale_directory` | Full rebuild; set `structure` explicitly |
| Edit target locale JSON only | Reuse analysis (`target locale only`) |
| Edit source locale JSON only | Partial `missingKeys` refresh |

## See also

- [Locales config](../../config/locales.md)
- [CLI cache — files.json](../../cli/cache.md#filesjson)
- [ADR 008 — Cache ownership](../../architecture/decisions/008-cache-ownership-and-host-boundary.md)
- [ADR 010 — Locale layout and metadata modes](../../architecture/decisions/010-locale-layout-and-metadata-modes.md)
