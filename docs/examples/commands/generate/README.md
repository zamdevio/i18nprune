# Generate Examples

Run from repo root:

```bash
cd tests/fixtures/simple-i18n-app
```

## Flag-by-flag matrix

| Flag | What it controls | Example |
|---|---|---|
| `--target <codes>` | Required target locale code(s) for non-interactive runs | `... generate --target ja --dry-run` |
| `--dry-run` | Preview only; no translator writes to locale files | `... generate --target ja --dry-run` |
| `--metadata` | Structured leaf write/repair mode | `... --json generate --target ja --dry-run --metadata` |
| `--force` | Re-translate even when target already covers source paths | `... generate --target ja --force --dry-run` |
| `--resume` | Top-up existing locale JSON (review-eligible leaves matching source) | `... generate --resume --target ja --dry-run` |
| `--all` | With `--resume`: all non-source locales | `... generate --resume --all --dry-run` |
| `--ask` | With `--resume`, TTY: confirm multi-target list | `... generate --resume --target ja,ar --ask` |
| `-c, --config` | Explicit config file | `... -c i18nprune.config.ts --json generate --target ja --dry-run` |
| `--json` / `--json-pretty` | Machine envelope + compact/pretty formatting | `... --json generate --target ja --dry-run --json-pretty false` |
| `stdout redirection` + `--format` | Persist run artifact independent of stdout | `... stdout redirection ./out/generate-run.json --format json generate --target ja --dry-run` |
| `--source` / `--locales-dir` / `--src` / `--functions` | Global path/scanner overrides | `... --source en --locales-dir locales --src src --functions t,tt generate --target ja --dry-run` |

## Dry-run with metadata mode

```bash
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts --json generate --target ja --dry-run --metadata \
| jq '.data.targetResults[0].localeMetadata | {mode, promotedLegacyLeaves, repairedCorruptLeaves, byReason}'
```

## Inspect per-leaf decisions

```bash
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts --json generate --target ja --dry-run --metadata \
| jq '.data.targetResults[0].localeMetadata.leafDecisions[:20]'
```

## Compare legacy mode dry-run

```bash
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts --json generate --target ja --dry-run \
| jq '.data.targetResults[0].localeMetadata | {mode, strippedStructuredLeaves, unchangedLeaves}'
```

## Timing

```bash
time pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts generate --target ja --dry-run --metadata
```

## Global flag coverage

```bash
# config path + compact JSON
pnpm exec tsx ../../../packages/cli/bin/cli.ts -c i18nprune.config.ts --json generate --target ja --dry-run --json-pretty false

# write run artifact (separate from stdout envelope)
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts stdout redirection ./out/generate-run.json --format json generate --target ja --dry-run

# path/function overrides (useful when running outside default project layout)
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts --source en --locales-dir locales --src src --functions t,tt generate --target ja --dry-run
```

## JSON payload keys used here

- `data.targetResults[].localeMetadata.mode`
- `data.targetResults[].localeMetadata.byReason`
- `data.targetResults[].localeMetadata.leafDecisions[]`

See also: [jq cookbook](../../jq-cookbook/README.md)
