# Share SDK example

Demonstrates **`runShareList`**, **`resolveShareWorkerBaseUrl`**, and **`emitShareListHumanMessages`** from `@i18nprune/core`.

Upload/view/delete need host HTTP hooks (`ShareHostHooks.uploadProject`, etc.) — see the CLI `packages/cli/src/commands/share/workerHttp.ts` reference host.

Set `I18NPRUNE_WORKER_URL` in the environment (CLI-owned name) or pass an explicit URL into `resolveShareWorkerBaseUrl` before calling share ops.

```bash
pnpm tsx examples/sdk/share/runShareList.ts
```
