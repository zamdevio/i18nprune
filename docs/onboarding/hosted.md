# Hosted surfaces onboarding path

Use the hosted surfaces when you want a browser-based workflow (report UI, web workspace) or you want to share prepared snapshots with others.

## Public worker (the hosted API)
When you use `share`, your CLI (or SDK host) uploads prepared payloads to the public worker.

Worker base URL:
- `--worker-url` or `I18NPRUNE_WORKER_URL` (default `https://worker.i18nprune.dev`)

See: [Worker / edge runtime](../runtime/worker.md).

## Report UI (hosted demo)
The report UI can be opened from a hosted link:

`https://report.i18nprune.dev/#/?id=<reportId>`

This is convenient for sharing a report result, troubleshooting it in a browser, or exchanging a payload with your team.

See: [Report UI (embedded SPA)](../report/README.md) and [Report payload](../report/payload.md).

## Web workspace (hosted project view)
The web workspace can open a shared project by link:

`https://web.i18nprune.dev/#/workspace?id=<projectId>`

## What runs locally vs on the edge
Typical mental model:

- Local: the host prepares a sanitized snapshot (from your repo files) and sends it to the worker.
- Edge: the worker stores the prepared payload and returns metadata/snapshot on demand.
- Browser: the web UI opens and displays the returned data (using its own in-app routing).

The worker does not read your local `.i18nprune/cache` directly; it operates on the payload it receives.

## What to do first (short path)
1. Run `i18nprune share upload --project` to get a shared link.
2. Open the link in the browser (web workspace / report UI depending on what you shared).

## What to read next
- [`share`](../commands/share/README.md)
- [Worker / edge runtime](../runtime/worker.md)
- [Report UI (embedded SPA)](../report/README.md)
- [Report payload](../report/payload.md)
