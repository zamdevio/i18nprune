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

`sync` aligns each target locale file toward a **sync template**:

1. Start from **scan ∩ source** (`resolvedKeys` that exist in the source locale).
2. **Expand** with source leaves under `policies.preserve` (`copyKeys`, `copyPrefixes`, `uncertainPrefixes`) so declared trees hydrate even when the scan never resolved those keys.
3. **Merge** missing template paths from source, then **prune** paths not in the template.

Prune may **retain** branches under:

- declared preserve / `uncertainPrefixes`
- **auto** uncertain prefixes when `reference.uncertainKeyPolicy` is `protect` or `warn_only` (default) — common for dynamic `t(\`…\`)` sites

Human stderr reports **pruned extras** as paths removed because they are **not in the sync template** (and not kept by those rules). That number is **not** the same as suggestion / tip counts of keys **extra vs the code scan**.

### Migration (drop scan anchors)

If you maintained a scan-only “dynamic anchors” file so sync would keep nav/settings trees, prefer:

```ts
policies: {
  preserve: {
    copyPrefixes: ['navigation.'], // verbatim / skip MT
    // uncertainPrefixes: ['seo.routes'], // shape keep; allow generate --resume
  },
}
```

Then remove the anchor file once you are on **i18nprune ≥ 1.0.3**.

## Sync vs tips vs `cleanup` (different datasets)

| Layer | Dataset | What “extra” means |
|-------|---------|-------------------|
| **Tips** (`validate`, `sync`, `generate`) | Target locale leaves vs **code scan** | Keys on disk not in `resolvedKeys` |
| **`sync` prune log** | Target leaves vs **sync template** (scan ∩ source **+ preserve expansion**) | Keys removed because absent from template (after keep rules) |
| **`cleanup --target`** | Target leaves vs **code scan** | Keys to remove if you want the file to match the scan (subject to preserve / `--rg`) |

Example: a tip may report **115 extra** keys in `so.json` while sync prints **`0 extra path(s) removed`** — sync kept those paths (preserve and/or uncertain-prefix protect). That is expected.

When sync retains scan-extras, it emits **`i18nprune.sync.scan_extras_retained`** (`info`) with sample paths and reasons (`copyKey` / `copyPrefix` / `uncertainPrefix` / `autoUncertain`), plus **`--json`** field **`data.scanExtrasRetained`**. See [Sync issues — `scan_extras_retained`](../issues/sync.md#scan-extras-retained).

`sync` does **not** replace target cleanup. Use **`cleanup --target <code>`** when you want scan-based pruning.

## Metadata flag conflict

If both `--metadata` and `--strip-metadata` are passed, `--strip-metadata` wins. The run continues and emits `i18nprune.sync.metadata_flag_conflict` so automation can detect ambiguous intent.

`sync --metadata` does not call translation providers. It applies shared normalize/promote/repair leaf handling. `sync --strip-metadata` is the explicit rollback path that removes structured fields and keeps only plain string values.

## Placeholder sentinel repair

When a target leaf still contains stale MT mask sentinels (`__I18NPRUNE_*` or spaced variants) instead of `{{…}}` tokens, **`sync`** copies the **source** string at the same path over the leaked target value (no machine translation). Placeholders work in the UI; copy may remain in the source language until **`generate`**.

- Human output: **`notice`** when repairs apply — `Copied N source value(s) over placeholder sentinel leaks in …`
- **`--dry-run`:** preview only; JSON includes **`wouldRepairSentinelLeaks`** and **`sentinelRepairs[]`** with **`mode: "copy_source"`, **`from`**, **`to`**, per-path detail in human **`detail`** lines
- Opt out: **`--no-repair-sentinel-leaks`**
- Skipped when the **source** also leaks at the same path — fix source copy first

Detect-only (no writes): **`validate`**, **`quality`**, **`review`** emit **`i18nprune.locale.placeholder_sentinel_leak`**. Proper localized repair: **`generate --metadata --target <locale>`**. See [Locale issues — `placeholder_sentinel_leak`](../issues/locale.md#placeholder-sentinel-leak).

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
- optional `sentinelRepairs[]` (`path`, `mode: "copy_source"`, `from`, `to`, `localeCode`, `localeFile`)
- optional `wouldRepairSentinelLeaks` on `--dry-run` when sentinel repairs would apply
- optional `scanExtrasRetained[]` — `{ localeCode, localeFile, retained: [{ path, reason }] }` when sync kept scan-extras

```bash
# List changed files only
i18nprune sync --dry-run --json | jq '.data.files[] | select(.changed)'

# Compact run summary for CI logs
i18nprune sync --dry-run --json \
  | jq '{targets: .data.targetFiles, changed: .data.writtenFiles, dynamic: .data.dynamicKeySites}'

# Retained scan-extras with reasons
i18nprune sync --dry-run --json \
  | jq '.data.scanExtrasRetained[]? | {locale: .localeCode, retained}'

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
