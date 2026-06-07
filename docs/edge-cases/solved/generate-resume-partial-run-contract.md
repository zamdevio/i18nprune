---
description: "Teams expect generate --resume to mean “only fill gaps,” but provider cache layers, --dry-run, and per-target status fields make it easy to misread a run as…"
---

# Generate `--resume` partial-run contract

## Problem

Teams expect **`generate --resume`** to mean “only fill gaps,” but provider cache layers, `--dry-run`, and per-target status fields make it easy to misread a run as a no-op or a full rewrite.

## What we do

1. **`--resume` scope:** translate only **missing or placeholder** leaves on existing target locale files; do not recreate files that are already complete for the selected keys.
2. **`--all` pairing:** expands targets to every configured non-source locale; commonly used with `--resume` for monorepo top-up jobs.
3. **Provider cache is separate:** L1/L2 translation cache ([CLI cache](../../cli/cache.md)) speeds repeat **provider** calls — it does not replace `--resume` leaf selection or locale JSON on disk.
4. **`--json` contract:** read per-target results from `.data.targetResults[]` — fields such as `partial`, `resumeUpdatedLeafCount`, and `status` describe what would have or did change.

## Common outcomes

| Observation | Likely cause |
|-------------|----------------|
| `resumeUpdatedLeafCount` is 0 | Targets already populated for scanned keys |
| Writes despite `--dry-run` confusion | `--dry-run` suppresses disk writes but JSON still reports planned deltas |
| High `fallbackCount` | Provider fallback pressure — not a resume bug |

## See also

- [generate command](../../commands/generate.md)
- [Examples — generate resume](../../examples/README.md)
- [generate issues](../../issues/generate.md)
- [ADR 008 — Cache ownership](../../architecture/decisions/008-cache-ownership-and-host-boundary.md) (translate L1/L2 vs locale files)
