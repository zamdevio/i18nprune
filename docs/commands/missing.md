---
description: Add dotted key paths seen in source translation calls but missing from a chosen locale file (default target is the source locale file).
---

# `missing`

Add dotted key paths seen in source translation calls but missing from a chosen locale file (default target is the source locale file).

```bash
i18nprune missing --dry-run
i18nprune missing --target ja --yes
```

## When to use

- Backfill missing key paths before running `generate`.
- Repair locale files that lag behind source extraction.
- Gate drift in CI by checking planned additions via `--dry-run --json`.

## Write target

- Omit `--target`: writes to the source locale file.
- Use `--target <code[,code]|all>`: writes to existing target locale files.

`missing` does not call translation APIs; it writes placeholders (default `__I18NPRUNE_MISSING__`). You can customize this via `i18nprune.config.*` at `missing.placeholder` (for example: `export default { missing: { placeholder: "__TODO_TRANSLATE__" } }`).

## Core behavior

`missing` computes missing dotted paths from extraction output and writes placeholder leaves into the selected locale files. It does not translate values or validate semantic correctness of placeholder text.

## jq usage (`--json`)

`missing --json` emits `MissingJsonOutput` in `data`:

- `kind`, `targetPath`, `targetKind`
- `pathsAdded`, `paths[]`, `targets[]`
- `placeholderLeaves` (`count`, `shown`, `leaves[]`)
- `skippedTargets[]`, `skippedNotInScan[]`

```bash
# Show write impact and placeholder pressure
i18nprune missing --target ja --dry-run --json \
  | jq '{pathsAdded: .data.pathsAdded, placeholders: .data.placeholderLeaves.count, skippedTargets: .data.skippedTargets}'

# Print concrete paths planned for write
i18nprune missing --target ja --dry-run --json | jq '.data.paths'

# Summarize per-target additions and skipped files
i18nprune missing --target ja,fr --dry-run --json \
  | jq '{
      targets: .data.targets,
      pathsAdded: .data.pathsAdded,
      skippedTargets: .data.skippedTargets,
      skippedNotInScan: .data.skippedNotInScan
    }'

# Show placeholder sample leaves with path/value shape
i18nprune missing --target ja --dry-run --json \
  | jq '.data.placeholderLeaves.leaves[]? | {path, value}'
```

## Suggested next steps

`missing` may emit **`[tip]`** hints (and `data.suggestions[]` with `--json`):

| Situation | Stable `id` | Typical command |
|-----------|-------------|-----------------|
| Source locale still has unused keys | `suggest.cleanup.source_unused` | `i18nprune cleanup --dry-run` |
| Paths were added (non-dry-run) | `suggest.generate.after_missing` | `i18nprune generate --target all` |
| Unknown `--target` (typo) | `suggest.missing.target_typo` | (fix target code; no auto command) |

## Troubleshooting

- No additions with expected drift: ensure the target locale exists and is part of scanned locale config.
- High placeholder counts: run `generate` next to convert placeholders into translated content.
- Writes to source locale by default: pass `--target` explicitly when you intend target-only updates.

## Related

- [validate](./validate.md)
- [sync](./sync.md)
- [generate](./generate.md)
- [Configuration](../config/README.md)
- [jq cookbook](../examples/jq-cookbook.md)
