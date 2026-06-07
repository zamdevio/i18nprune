---
description: Sync target locale JSON structure to match source locale shape while respecting policies.preserve.
---

# `sync`

Sync target locale JSON structure to match source locale shape while respecting `policies.preserve`.

```bash
i18nprune sync --dry-run
i18nprune sync --target ja,pt-br
```

## When to use

- Normalize locale tree shape after source key additions/removals.
- Preview structural changes safely with `--dry-run`.
- Apply metadata transforms across target locales when preparing translation workflows.

## Metadata modes

- `--metadata`: write/repair structured locale leaves
- `--strip-metadata`: convert structured leaves back to plain strings
- If neither flag is passed, `sync` does not mutate metadata mode by flags and uses the configured/current leaf mode as-is.

## Core behavior

`sync` aligns each target locale file toward a **sync template**: source locale keys that appear in the **current code scan** (`resolvedKeys`), not the full source JSON file and not “extra vs scan” counts from tips.

Per target file it **merges** missing scan keys from source, then **prunes** paths not in that template. Prune may **retain** branches under **uncertain key prefixes** when `reference.uncertainKeyPolicy` is `protect` or `warn_only` (default) — common when dynamic `t(\`…\`)` sites exist.

Human stderr reports **pruned extras** as paths removed because they are **not in the sync template** (and not kept by uncertain-prefix rules). That number is **not** the same as suggestion / tip counts of keys **extra vs the code scan**.

## Sync vs tips vs `cleanup` (different datasets)

| Layer | Dataset | What “extra” means |
|-------|---------|-------------------|
| **Tips** (`validate`, `sync`, `generate`) | Target locale leaves vs **code scan** | Keys on disk not in `resolvedKeys` |
| **`sync` prune log** | Target leaves vs **sync template** (scan ∩ source) | Keys removed because absent from template (after uncertain-prefix keep) |
| **`cleanup --target`** | Target leaves vs **code scan** | Keys to remove if you want the file to match the scan (subject to preserve / `--rg`) |

Example: a tip may report **115 extra** keys in `so.json` while sync prints **`0 extra path(s) removed`** — sync kept those paths (often under uncertain-prefix protect). That is expected.

When sync retains scan-extras, it emits **`i18nprune.sync.scan_extras_retained`** (`info`) with guidance to run **`cleanup --target <code> --dry-run`**. See [Sync issues — `scan_extras_retained`](../issues/sync.md#scan-extras-retained).

`sync` does **not** replace target cleanup. Use **`cleanup --target <code>`** when you want scan-based pruning.

## Metadata flag conflict

If both `--metadata` and `--strip-metadata` are passed, `--strip-metadata` wins. The run continues and emits `i18nprune.sync.metadata_flag_conflict` so automation can detect ambiguous intent.

`sync --metadata` does not call translation providers. It applies shared normalize/promote/repair leaf handling. `sync --strip-metadata` is the explicit rollback path that removes structured fields and keeps only plain string values.

## Examples

```bash
# Preview shape changes across all configured targets
i18nprune sync --dry-run

# Sync specific locales
i18nprune sync --target ja,pt-br

# Compare metadata and plain-string transforms before write
i18nprune sync --metadata --target ja --dry-run
i18nprune sync --strip-metadata --target ja --dry-run
```

## jq usage (`--json`)

`sync --json` emits `SyncJsonOutput` in `data`:

- `kind: "sync"`
- `sourcePath`, `localesDir`
- `targetFiles`, `writtenFiles`
- `dynamicKeySites`, `dryRun`
- `files[]` (`path`, `changed`)
- optional `localeMetadataReports`

```bash
# List changed files only
i18nprune sync --dry-run --json | jq '.data.files[] | select(.changed)'

# Compact run summary for CI logs
i18nprune sync --dry-run --json \
  | jq '{targets: .data.targetFiles, changed: .data.writtenFiles, dynamic: .data.dynamicKeySites}'

# Show only changed paths and change type hints
i18nprune sync --dry-run --json \
  | jq '.data.files[] | select(.changed) | {path, changed, reason: (.reason // "shape-diff")}'

# Surface locale metadata report entries when present
i18nprune sync --metadata --dry-run --json \
  | jq '.data.localeMetadataReports[]? | {target: (.target // null), converted: (.convertedLeaves // 0)}'
```

## Suggested next steps

`sync` shares the same cross-op suggestion engine as `generate` and `validate`:

| Situation | Stable `id` | Typical command |
|-----------|-------------|-----------------|
| Source locale has unused keys | `suggest.cleanup.source_unused` | `i18nprune cleanup --dry-run` |
| Target locale has extra keys | `suggest.cleanup.target_extra` | `i18nprune cleanup --target <code> --dry-run` |

Tips flag target keys **extra vs the code scan**. `sync` aligns to **scan ∩ source** and may **keep** scan-extras under uncertain-prefix rules — see [Sync vs tips vs `cleanup`](#sync-vs-tips-vs-cleanup-different-datasets). Use **`cleanup --target <code> --dry-run`** to preview scan-based removal before **`--yes`** / **`--ask`**.

## Troubleshooting

- **Tip shows N target extras, sync shows `0 extra path(s) removed`:** different metrics — see [Sync vs tips vs `cleanup`](#sync-vs-tips-vs-cleanup-different-datasets). Run `cleanup --target <code> --dry-run` for scan-based removal preview.
- Zero changed files with expected drift: verify `--target` selection and loaded config path.
- Unexpected key removals usually point to keys dropped from the sync template (source scan keys removed from source JSON).
- Metadata conversion appears skipped when locale leaves are already in requested mode.

## Related

- [generate](./generate.md)
- [missing](./missing.md)
- [Locales config](../config/locales.md)
- [jq cookbook](../examples/jq-cookbook.md)
