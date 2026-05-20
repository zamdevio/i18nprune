# `share`

Upload project snapshots or stored reports to the worker, and manage local **`share.json`** cache metadata beside the analysis cache.

## Subcommands

| Subcommand | Purpose |
|------------|---------|
| *(bare `share`)* | Shows subcommand help (same pattern as `locales`) |
| `upload` | `--project` (zip) or `--report` (+ optional `--from`) |
| `list` | List cached share rows for this project |
| `view` | `GET /v1/projects/:id` or `/v1/reports/:id` metadata |
| `delete` | Remove one row (`--project` / `--report`) or every row (`--all`) |

## Examples

```bash
# Help
i18nprune share
i18nprune help share

# Upload project snapshot
i18nprune share upload --project

# Upload report JSON
i18nprune share upload --report --from reports/index.json

# List / delete
i18nprune share list
i18nprune share delete --report <workerReportId>
i18nprune share delete --project <workerProjectId>
i18nprune share delete --all
i18nprune share delete --all --local-only
```

Worker URL: `--worker-url` or `I18NPRUNE_WORKER_URL` (default `https://worker.i18nprune.dev`).

## Issue codes

[Share issues](../issues/share.md) — `json_repaired`, `cache_entry_not_found`, `remote_*`, …
