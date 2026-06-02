# `cleanup`

Remove unused keys from the source locale file using extractor observations, preserve/parity policy, uncertain-prefix safeguards, and optional ripgrep checks.

## When to use

- Before release to reduce stale locale keys.
- In CI with `--dry-run --json` to detect cleanup drift.
- During manual review when you want interactive confirmation.

## Real CLI flags

`i18nprune cleanup -h` currently exposes:

- `--dry-run`: preview removals without writing.
- `--no-rg`: skip ripgrep string-presence guard (static unused-key list only).
- `--ask`: interactive TTY batch confirmation (grouped by top-level namespace).
- `--ask-per-key`: interactive TTY per-key confirmation.
- `-h, --help`: help output.

`--ask` / `--ask-per-key` are ignored in non-interactive contexts and overridden by global `--yes`.

## Core behavior

`cleanup` computes candidate removals from observed usage, then filters through preserve/parity policy and uncertainty guards. With ripgrep enabled (default), candidates also pass string-presence safety checks.

## Examples

```bash
# Preview with rg safety enabled (default)
i18nprune cleanup --dry-run

# CI-style static plan only (no ripgrep probes)
i18nprune cleanup --dry-run --no-rg --json

# Interactive review in namespaces
i18nprune cleanup --ask
```

## jq usage (`--json`)

`cleanup --json` emits the standard envelope (`ok`, `kind`, `data`, `issues`, `meta`) where `data` is `CleanupJsonOutput`:

- `wouldRemove`
- `keys[]`
- `dynamicKeySites`
- `uncertainPrefixes[]`
- optional `summary` (`durationMs`, `command`, `ok`, `counts`)

```bash
# Quick CI gate: fail if any key would be removed
i18nprune cleanup --dry-run --json | jq -e '.data.wouldRemove == 0'

# Show top candidate key paths
i18nprune cleanup --dry-run --json | jq '.data.keys[:20]'

# Group candidates by top-level namespace
i18nprune cleanup --dry-run --json \
  | jq '.data.keys
    | map(split(".")[0])
    | group_by(.)
    | map({namespace: .[0], count: length})'

# Track uncertainty and issue codes
i18nprune cleanup --dry-run --json \
  | jq '{uncertainPrefixes: .data.uncertainPrefixes, issues: [.issues[]? | {code, severity}]}'
```

## Troubleshooting

- Unexpected removals: rerun without `--no-rg` so presence checks are active.
- No interactive prompts: run in a TTY and verify `--yes` is not set globally.
- High `uncertainPrefixes`: review dynamic key prefix strategy before applying removals.

## Related

- [missing](./missing.md)
- [sync](./sync.md)
- [Issues reference](../issues/README.md)
- [jq cookbook](../examples/jq-cookbook.md)
