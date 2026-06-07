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

`sync` aligns key topology between source and target locale files. It can add missing branches, prune removed branches, and optionally convert leaf representation with metadata flags.

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

Sync copies the **source shape** into targets; it does not remove extra target-only keys. Use the target-extra tip to preview `cleanup --target` before applying with `--yes`.

## Troubleshooting

- Zero changed files with expected drift: verify `--target` selection and loaded config path.
- Unexpected key removals usually point to source locale key deletion (sync enforces source shape).
- Metadata conversion appears skipped when locale leaves are already in requested mode.

## Related

- [generate](./generate.md)
- [missing](./missing.md)
- [Locales config](../config/locales.md)
- [jq cookbook](../examples/jq-cookbook.md)
