# i18nprune meta worker

Versioned JSON API for **GitHub** repo stats, **npm** (CLI + core only), and the **VS Code Marketplace** extension row — plus curated **links**.

- **Custom domain:** `https://meta.i18nprune.dev`
- **Wrangler name:** `meta` · Durable Object: `MetaCacheDO` · binding `META_CACHE`
- **TTL:** GitHub 120s · npm 600s · extension (Marketplace) 900s

## Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Discovery JSON (versions, endpoint list, quick-start, links to docs/OpenAPI). |
| GET | `/health` | Short liveness (unversioned). |
| GET | `/v1/health` | Versioned liveness. |
| GET | `/v1/meta` | **Canonical** full snapshot. |
| GET | `/v1/github` | Same `github` + `cache.github` as in `/v1/meta`. |
| GET | `/v1/npm` | Same `npm` + `cache.npm` as in `/v1/meta`. |
| GET | `/v1/extension` | Same `extension` + `cache.extension` as in `/v1/meta`. |
| GET | `/openapi.json` | OpenAPI 3.0 document. |
| GET | `/docs` | Swagger UI. |

Query **`?force=1`** on any `/v1/*` route that hits the DO to bypass that request’s cache read (refresh upstreams).

## Response contract (`/v1/meta`)

- Top level: `ok`, `version` (always `1` for this prefix), `generatedAtUnix`.
- `cache.{github,npm,extension}`: each `{ stale, updatedAtUnix, expiresAtUnix }`.
- `links`: string map (see `src/constants/urls.ts`).
- `github`: `owner`, `repo`, counters, `error` (GitHub upstream message or `null`).
- `npm`: `{ cli, core }` — each `{ name, version, lastPublishUnix, error }`.
- `extension`: `{ publisher, name, version, lastPublishUnix, error }` from **VS Code Marketplace** (not npm).

Legacy routes (`/metadata`, `/npm`, …) are **removed**.

## Constants layout

- `src/constants/github.ts` — repo coordinates.
- `src/constants/npm.ts` — CLI + core package names only.
- `src/constants/extension.ts` — Marketplace publisher + extension name.
- `src/constants/urls.ts` — default `links` URLs.
- `src/constants/products.ts` — discovery copy for `GET /`.

## Local dev

```bash
cd apps/workers/meta
pnpm install
pnpm dev
```

## Deploy

```bash
pnpm deploy
```

Optional: `wrangler secret put GITHUB_TOKEN` for higher GitHub API rate limits.
