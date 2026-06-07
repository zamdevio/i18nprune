# `cleanup`

Remove unused keys from locale files using extractor observations, preserve/parity policy, and uncertain-prefix safeguards. Ripgrep string-presence checks are optional (`--rg`).

## When to use

- Before release to reduce stale locale keys.
- In CI with `--dry-run --json` to detect cleanup drift.
- During manual review when you want interactive confirmation.

## Real CLI flags

`i18nprune cleanup -h` currently exposes:

- `--dry-run`: preview removals without writing.
- `--target <code>`: prune a **target** locale (keys present on disk but not in the code scan); omit for **source** locale cleanup (default).
- `--rg`: enable ripgrep string-presence guard (substring search on translation values in `src/`; may false-positive on short English strings).
- `--ask`: interactive TTY batch confirmation (grouped by top-level namespace).
- `--ask-per-key`: interactive TTY per-key confirmation.
- Global `--yes`: apply removals without prompts (non-interactive writes).
- Global `--top` / `--full`: cap or expand string-presence skip lines in human output.
- `-h, --help`: help output.

`--ask` / `--ask-per-key` are ignored in non-interactive contexts and overridden by global `--yes`. Destructive runs without `--yes` require a TTY confirm (or use `--dry-run` / `--json`).

## Core behavior

`cleanup` computes candidate removals from observed usage, then filters through preserve/parity policy and uncertainty guards. By default, removals rely on the static code scan only. Pass `--rg` to also block candidates when a translation **value** appears as a substring somewhere under `src/` (conservative; not proof of key usage).

## Examples

```bash
# Preview removals (static scan — default)
i18nprune cleanup --dry-run

# CI JSON gate (static scan)
i18nprune cleanup --dry-run --json

# Optional ripgrep substring guard (may block removals on false positives)
i18nprune cleanup --dry-run --rg

# Interactive review in namespaces
i18nprune cleanup --ask

# Prune extra keys from a target locale after dry-run review
i18nprune cleanup --target ar --dry-run
i18nprune cleanup --target ar --yes
```

## jq usage (`--json`)

`cleanup --json` emits the standard envelope (`ok`, `kind`, `data`, `issues`, `meta`) where `data` is `CleanupJsonOutput`:

- `wouldRemove`
- `keys[]`
- `dynamic`
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

## Suggested next steps

During **`cleanup --dry-run`**, when candidates exist, a **`[tip]`** may suggest applying removals after review:

| Situation | Stable `id` | Typical command |
|-----------|-------------|-----------------|
| Dry-run found removable keys | `suggest.cleanup.source_unused` / `suggest.cleanup.target_unused` | `i18nprune cleanup --yes` or `i18nprune cleanup --ask` |
| Dry-run for target locale | `suggest.cleanup.target_unused` | `i18nprune cleanup --target <code> --yes` |

Other commands (`validate`, `generate`, `sync`) emit source-unused tips with `cleanup --dry-run` and target-extra tips with `cleanup --target <code> --dry-run`.

## Troubleshooting

- Unexpected removals: rerun with `--rg` for a conservative substring guard, or review dynamic-key / uncertain-prefix warnings first.
- No interactive prompts: run in a TTY and verify `--yes` is not set globally.
- High `uncertainPrefixes`: review dynamic key prefix strategy before applying removals.

## Related

- [missing](./missing.md)
- [sync](./sync.md)
- [Issues reference](../issues/README.md)
- [jq cookbook](../examples/jq-cookbook.md)
