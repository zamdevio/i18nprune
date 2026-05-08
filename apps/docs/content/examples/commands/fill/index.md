# Fill Examples

Run from repo root:

```bash
cd tests/fixtures/simple-i18n-app
```

## Flag-by-flag matrix

| Flag | What it controls | Example |
|---|---|---|
| `--target <codes>` | One locale or comma-separated list | `... fill --target ja,pt-br --dry-run` |
| `--all` | Fill all non-source locale files | `... fill --all --dry-run` |
| `--dry-run` | Preview updates without writes/API calls | `... --json fill --target ja --dry-run` |
| `--metadata` | Structured leaf write/repair mode | `... --json fill --target ja --dry-run --metadata` |
| `--ask` | Interactive confirmation for selected targets | `... fill --target ja,ar --ask` |
| `-c, --config` | Explicit config file | `... -c i18nprune.config.ts --json fill --target ja --dry-run` |
| `--json` / `--json-pretty` | Machine envelope + compact/pretty formatting | `... --json fill --target ja --dry-run --json-pretty false` |
| `stdout redirection` + `--format` | Persist run artifact independent of stdout | `... stdout redirection ./out/fill-run.csv --format csv fill --target ja --dry-run` |
| `--yes` | Non-interactive approval for write flows | `... --yes fill --target ja` |

## Dry-run metadata report

```bash
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts --json fill --target ja --dry-run --metadata \
| jq '.data.targetResults[0].localeMetadata | {mode, repairedCorruptLeaves, promotedLegacyLeaves, unchangedLeaves}'
```

## Per-leaf actions for fill

```bash
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts --json fill --target ja --dry-run --metadata \
| jq '.data.targetResults[0].localeMetadata.leafDecisions | group_by(.action) | map({action: .[0].action, count: length})'
```

## Non-metadata dry-run

```bash
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts --json fill --target ja --dry-run \
| jq '.data.targetResults[0].localeMetadata | {mode, strippedStructuredLeaves}'
```

## Timing

```bash
time pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts fill --target ja --dry-run --metadata
```

## Global flag coverage

```bash
# compact JSON envelope
pnpm exec tsx ../../../packages/cli/bin/cli.ts -c i18nprune.config.ts --json fill --target ja --dry-run --json-pretty false

# run artifact output for audit trail
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts stdout redirection ./out/fill-run.csv --format csv fill --target ja --dry-run

# non-interactive write with explicit yes
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts --yes fill --target ja
```

## JSON payload keys used here

- `data.targetResults[].localeMetadata.mode`
- `data.targetResults[].localeMetadata.repairedCorruptLeaves`
- `data.targetResults[].localeMetadata.leafDecisions[]`

See also: [jq cookbook](../../jq-cookbook)
