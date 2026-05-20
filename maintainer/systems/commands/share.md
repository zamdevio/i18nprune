# Command — `share`

**User docs (when landed):** `docs/commands/share/README.md` (Session D).  
**Plan / tracker:** [`maintainer/phases/apps.md`](../../phases/apps.md).

## Entrypoints

| Surface | Path |
|---------|------|
| Core upload | `packages/core/src/share/run.ts` → `runShare` |
| Core list / view / delete | `list.ts`, `view.ts`, `delete.ts` |
| Human lines (all hosts) | `packages/core/src/share/human.ts` → `emitShare*HumanMessages` via `run.message` |
| Worker URL normalize | `resolveShareWorkerBaseUrl(workerUrl?)` — default `https://worker.i18nprune.dev` |
| CLI argv + env | `packages/cli/bin/cli.ts` (`share` tree) · `resolveCliShareWorkerBaseUrl` in `commands/share/workerUrl.ts` · `ENV_I18NPRUNE_WORKER_URL` in `packages/cli/src/constants/env.ts` |
| CLI HTTP hooks | `commands/share/workerHttp.ts` → `DELETE /v1/projects/:id`, `DELETE /v1/reports/:id` |
| SDK example | `examples/sdk/share/runShareList.ts` |

## `share delete` behavior

- **Default:** removes matching `share.json` entry **and** calls worker DELETE.
- **`--local-only`:** cache metadata only (no HTTP).
- Worker **404** on DELETE is treated as success (row already gone).

## Parity

New `share --json` envelopes only — do not change existing op parity fixtures.
