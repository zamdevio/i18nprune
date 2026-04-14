# i18nprune GitHub Worker

Durable Object backed cache for GitHub repository metadata used by the web app.

- Worker name: `github-i18nprune`
- Default URL: `https://github-i18nprune.workers.dev`
- Custom domain: `https://github.i18nprune.dev`
- Cache TTL: 120 seconds

## Endpoints

- `GET /health`
- `GET /metadata`
- `GET /repo` (alias of metadata)
- `GET /contributors` (alias of metadata)

All metadata endpoints return a unified payload:

- `data`: stars/forks/issues/watchers/contributors/apiError
- `fetchedAtUnix`
- `expiresAtUnix`
- `nextRefreshUnix`
- `source`: `live | cache | stale-cache`
- `stale`: boolean

## Local dev

```bash
cd apps/workers/github
pnpm install
pnpm dev
```

## Deploy

```bash
cd apps/workers/github
pnpm deploy
```

Optionally set `GITHUB_TOKEN` as a worker secret for higher API rate limits:

```bash
wrangler secret put GITHUB_TOKEN
```
