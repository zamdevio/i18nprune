# `cleanup`

Remove unused keys from locale files using extractor observations, preserve/parity policy, and uncertain-prefix safeguards. Ripgrep string-presence checks are optional (`--rg`).

## When to use

- Before release to reduce stale locale keys.
- In CI with `--dry-run --json` to detect cleanup drift.
- During manual review when you want interactive confirmation.

## Real CLI flags

`i18nprune cleanup -h` currently exposes:

- `--dry-run`: preview removals without writing.
- `--target <code[,code]|all>`: prune one or more **target** locales (keys present on disk but not in the code scan); omit for **source** locale cleanup (default).
- `--rg`: enable ripgrep string-presence guard (substring search on translation values in `src/`; may false-positive on short English strings).
- `--ask`: interactive TTY batch confirmation (grouped by top-level namespace).
- `--ask-per-key`: interactive TTY per-key confirmation.
- Global `--yes`: apply removals without prompts (non-interactive writes).
- Global `--top <n>` / `--full`: cap or expand **`--rg` string-presence skip lines** only (verbose `[detail]` rows). Does **not** print the full removable key path list in human mode — use `--json` + `jq '.data.keys'` for that.
- `-h, --help`: help output.

`--ask` / `--ask-per-key` are ignored in non-interactive contexts and overridden by global `--yes`. Destructive runs without `--yes` require a TTY confirm (or use `--dry-run` / `--json`).

## Core behavior

`cleanup` computes candidate removals from observed usage, then filters through preserve/parity policy and uncertainty guards. By default, removals rely on the static code scan only. Pass `--rg` to also block candidates when a translation **value** appears as a substring somewhere under `src/` (conservative; not proof of key usage).

## Cleanup vs `sync` vs tips (different datasets)

| Mode | Locale | Candidate set |
|------|--------|-----------------|
| **`cleanup`** (default) | **Source** | Source keys not in **code scan** (minus preserve; uncertain-prefix exclude when `reference.uncertainKeyPolicy` protects) |
| **`cleanup --target <code[,code]|all>`** | **Target(s)** | Target keys not in **code scan** (minus preserve) |
| **`sync`** | Target | Merge/prune vs **scan ∩ source** template; may **keep** scan-extras under uncertain prefixes |

Tips (`suggest.cleanup.target_extra`) use the same **scan-extra** dataset as **`cleanup --target --dry-run`**, not the sync prune log. If `sync` reports **`0 extra path(s) removed`** but tips still show target extras, run **`cleanup --target <code> --dry-run`** — see [sync command doc](./sync.md#sync-vs-tips-vs-cleanup-different-datasets) and [`i18nprune.sync.scan_extras_retained`](../issues/sync.md#scan-extras-retained).

### `--top` / `--full` on `cleanup`

Global **`--top`** and **`--full`** apply only to **string-presence evidence** when **`--rg`** is set (the numbered `string-presence guard skipped` lines). They do **not** change candidate counts or list every removable path on stderr.

- Without **`--rg`**: `--top` / `--full` have no visible effect (no string-presence lines).
- With **`--rg`**: `--top 3` shows up to three blocked keys; `--full` shows every blocked key.
- Full candidate paths: **`cleanup --dry-run --json | jq '.data.keys'`** (optionally slice with jq).

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

# Prune several targets (per-locale scan lines and confirmations)
i18nprune cleanup --target ja,ms,pt --dry-run
i18nprune cleanup --target all --ask
```

## jq usage (`--json`)

`cleanup --json` emits the standard envelope (`ok`, `kind`, `data`, `issues`, `meta`) where `data` is `CleanupJsonOutput`:

- `wouldRemove`
- `keys[]`
- `dynamic`
- `uncertainPrefixes[]`
- optional `targetLocale` (single `--target`)
- optional `targetLocales[]` and `targets[]` (multi-target / `all`)
- optional `skippedTargets[]`
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

# Per-target removable counts when --target lists multiple codes
i18nprune cleanup --target ja,ms --dry-run --json \
  | jq '.data.targets | map({locale: .localeCode, wouldRemove: .wouldRemove})'
```

## Suggested next steps

During **`cleanup --dry-run`**, when candidates exist, a **`[tip]`** may suggest applying removals after review:

| Situation | Stable `id` | Typical command |
|-----------|-------------|-----------------|
| Dry-run found removable keys | `suggest.cleanup.source_unused` / `suggest.cleanup.target_unused` | `i18nprune cleanup --yes` or `i18nprune cleanup --ask` |
| Dry-run for target locale | `suggest.cleanup.target_unused` | `i18nprune cleanup --target <code> --yes` |

Other commands (`validate`, `generate`, `sync`) emit source-unused tips with `cleanup --dry-run` and target-extra tips with `cleanup --target <code> --dry-run`. Combine targets in one run with comma-separated codes or `all` (same pattern as `missing` / `sync`).

### Multi-target human output

When `--target` lists more than one code (or `all`), scan and dry-run lines are prefixed with `(locale)` so counts match each file. `--ask`, `--ask-per-key`, and the default confirm prompt run **per locale** (same as `missing`). The post-write sync hint appears only after **source** locale cleanup (as a `[notice]`).

## Troubleshooting

- **`--top` / `--full` seem to do nothing:** they only cap **`--rg`** string-presence skip lines, not the 83/115 candidate summary. Use `--json` for the full path list.
- Unexpected removals: rerun with `--rg` for a conservative substring guard, or review dynamic-key / uncertain-prefix warnings first.
- No interactive prompts: run in a TTY and verify `--yes` is not set globally.
- High `uncertainPrefixes`: review dynamic key prefix strategy before applying removals.

## Related

- [missing](./missing.md)
- [sync](./sync.md)
- [Issues reference](../issues/README.md)
- [jq cookbook](../examples/jq-cookbook.md)
