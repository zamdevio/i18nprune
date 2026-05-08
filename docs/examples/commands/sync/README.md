# Sync Examples

Run from repo root:

```bash
cd tests/fixtures/simple-i18n-app
```

## Flag-by-flag matrix

| Flag | What it controls | Example |
|---|---|---|
| `--target <codes>` | Scope to one or many locale files (`all` supported) | `... sync --target ja,pt-br --dry-run` |
| `--dry-run` | Preview only; no writes | `... sync --target ja --dry-run` |
| `--metadata` | Structured leaf write/repair mode | `... --json sync --target ja --dry-run --metadata` |
| `--strip-metadata` | Rewrite structured leaves back to plain strings | `... --json sync --target ja --dry-run --strip-metadata` |
| `-c, --config` | Explicit config file | `... -c i18nprune.config.ts --json sync --target ja --dry-run` |
| `--json` / `--json-pretty` | Machine envelope + compact/pretty formatting | `... --json sync --target ja --dry-run --json-pretty false` |
| `stdout redirection` + `--format` | Persist run artifact independent of stdout | `... stdout redirection ./out/sync-run.txt --format text sync --target ja --dry-run` |
| `--yes` | Non-interactive approval for write flows | `... --yes sync --target ja` |
| `--source` / `--locales-dir` / `--src` / `--functions` | Global path/scanner overrides | `... --source locales/en.json --locales-dir locales --src src --functions t,tt sync --target ja --dry-run` |

## Dry-run with metadata simulation

```bash
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts --json sync --target ja --dry-run --metadata \
| jq '.data.localeMetadataReports["ja.json"] | {mode, promotedLegacyLeaves, repairedCorruptLeaves, unchangedLeaves}'
```

## Per-leaf action histogram

```bash
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts --json sync --target ja --dry-run --metadata \
| jq '.data.localeMetadataReports["ja.json"].leafDecisions | group_by(.action) | map({action: .[0].action, count: length})'
```

## Strip metadata preview

```bash
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts --json sync --target ja --dry-run --strip-metadata \
| jq '.data.localeMetadataReports["ja.json"] | {mode, strippedStructuredLeaves, missingPathsHydratedFromSource}'
```

## Precedence edge case (`--metadata` + `--strip-metadata`)

```bash
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts --json sync --target ja --dry-run --metadata --strip-metadata \
| jq '{issues: .issues, mode: .data.localeMetadataReports["ja.json"].mode}'
```

Expected: warning issue `i18nprune.sync.metadata_flag_conflict`; final mode is `legacy_string` (strip precedence).

## Timing

```bash
time pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts sync --target ja --dry-run --metadata
```

## Global flag coverage

```bash
# JSON envelope + compact output
pnpm exec tsx ../../../packages/cli/bin/cli.ts -c i18nprune.config.ts --json sync --target ja --dry-run --metadata --json-pretty false

# write run report as text
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts stdout redirection ./out/sync-run.txt --format text sync --target ja --dry-run

# non-interactive write mode
pnpm exec tsx ../../../packages/cli/bin/cli.ts --config i18nprune.config.ts --yes sync --target ja
```

## JSON payload keys used here

- `data.localeMetadataReports["<code>.json"].mode`
- `data.localeMetadataReports["<code>.json"].leafDecisions[]`
- `issues[].code` (conflict check)

See also: [jq cookbook](../../jq-cookbook/README.md)
