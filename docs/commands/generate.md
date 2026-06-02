# `generate`

Generate translated target locale files from your source locale, with support for first-run generation, top-up (`--resume`), and dry-run verification.

```bash
i18nprune generate --target ja
i18nprune generate --resume --target ja
```

## When to use

- Create new target locale files from source keys.
- Fill only missing leaves for existing locales with `--resume`.
- Check provider pressure and generation coverage in CI with `--json`.

## Core behavior

`generate` reads extracted key observations and source leaves, then writes translated leaves for selected targets. In human mode, progress renders to stderr; in `--json`, quiet/silent, or non-TTY contexts, progress output is suppressed.

Key flags:

- `--target <code[,code]>` target locale codes to process.
- `--resume` fill only missing/placeholder leaves.
- `--all` expand to all configured target locales (commonly paired with `--resume`).
- `--metadata` write structured metadata leaves when metadata mode is enabled.
- `--dry-run` compute output without writing locale files.

## Metadata write behavior

`generate` always computes translation metadata during leaf processing. `--metadata` controls whether those structured leaves are persisted to locale JSON output.

If `--metadata` is not passed, output remains in plain string leaf mode unless your configured leaf mode is already structured.

## Examples

```bash
# First-time generation for selected targets
i18nprune generate --target ja,fr

# Resume existing locales and preview writes
i18nprune generate --target ja --dry-run

# Top-up all configured locales without writing
i18nprune generate --resume --all --dry-run
```

## jq usage (`--json`)

`generate --json` keeps the standard envelope and emits `GenerateJsonPayload` in `data`.

Useful shape-aware paths:

- `.kind` -> `"generate"`
- `.data.targets[]` requested targets
- `.data.dynamicKeySites`, `.data.leavesProcessed`
- `.data.targetResults[]` per-target status/counters/output
- optional `.data.targetResults[].providerAttempts[]` for fallback diagnostics

```bash
# Per-target status with write deltas
i18nprune generate --target ja,fr --dry-run --json \
  | jq '.data.targetResults[] | {
      target,
      status,
      partial,
      sourceLeafCount,
      resumeUpdatedLeafCount,
      outputPath
    }'

# Aggregate fallback pressure across targets
i18nprune generate --target ja --json \
  | jq '[.data.targetResults[].fallbackCount // 0] | add'

# Surface failed targets only
i18nprune generate --target ja,fr --json \
  | jq '.data.targetResults[] | select(.status != "ok") | {target, status, error: (.error // null)}'
```

## Troubleshooting

- No writes in `--resume` mode usually means targets are already fully populated.
- Large `fallbackCount` values indicate provider fallback pressure worth reviewing.
- If JSON consumers break, verify they read from `.data.targetResults[]` instead of parsing human stderr.

## Related

- [sync](./sync.md)
- [missing](./missing.md)
- [report](./report.md)
- [jq cookbook](../examples/jq-cookbook.md)
