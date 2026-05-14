# i18nprune meta worker (GitHub + npm)

Durable Object–backed cache for **GitHub** repository stats and **npm** registry versions (CLI, core, optional extension package name).

- **Wrangler script name:** `meta` → default URL `https://meta.<account>.workers.dev` (per Cloudflare account subdomain).
- **Custom domain:** `https://meta.i18nprune.dev`
- **Package:** `@i18nprune/worker-meta`
- **Durable Object:** binding `META_CACHE`, class `MetaCacheDO`
- **GitHub** cache TTL: **120 seconds**
- **npm** bundle cache TTL: **600 seconds** (versions change less often than stars)

## Endpoints

### Health

- `GET /health` — liveness JSON.

### GitHub (unchanged fields on `data.*`)

- `GET /metadata` — repo payload **plus** optional sibling `npm` (see below).
- `GET /repo` — same as `/metadata` (alias).
- `GET /contributors` — same as `/metadata` (alias).

`data` is still `{ owner, repo, stars, forks, openIssues, watchers, contributors, apiError }` for backward compatibility.

When npm resolution runs, responses also include:

```json
"npm": {
  "source": "live",
  "stale": false,
  "fetchedAtUnix": 1710000000,
  "expiresAtUnix": 1710000600,
  "nextRefreshUnix": 1710000600,
  "packages": {
    "cli": { "name": "i18nprune", "version": "0.4.2", "lastPublishUnix": null, "registryError": null },
    "core": { "name": "@i18nprune/core", "version": "…", "lastPublishUnix": null, "registryError": null },
    "extension": { "name": "@i18nprune/extension", "version": null, "lastPublishUnix": null, "registryError": "npm HTTP 404" }
  }
}
```

### npm only (standalone)

- `GET /npm` — full bundle: `ok`, cache meta, and `packages: { cli, core, extension }`.
- `GET /npm/cli` — one row: `slot`, `package` (`NpmPackageInfo`), same cache timestamps as `/npm`.
- `GET /npm/core`
- `GET /npm/extension`

Append `?force=1` to any DO-backed route to bypass cache for that request.

## npm package names

Defaults (override with worker **vars** / **secrets** in the dashboard or `wrangler.jsonc` `[vars]`):

| Slot        | Default registry name      | Notes |
|------------|------------------------------|--------|
| `cli`      | `i18nprune`                  | Installable CLI on npm. |
| `core`     | `@i18nprune/core`            | Scoped engine package. |
| `extension`| `@i18nprune/extension`       | Often **not** published on npm until you ship; expect `registryError` until then. |

Bindings / env keys: `NPM_CLI_PACKAGE`, `NPM_CORE_PACKAGE`, `NPM_EXTENSION_PACKAGE` (optional strings).

## Where to publish the VS Code / Cursor extension

- **Primary:** [Visual Studio Marketplace](https://marketplace.visualstudio.com/) — `vsce publish` / CI; extension id `publisher.extensionName`.
- **Also common:** [Open VSX](https://open-vsx.org/) for VSCodium and some forks — separate publish pipeline.

Those are **not** the npm registry. **Stars** on GitHub and **downloads** on the marketplace are different products:

- **GitHub stars** — this worker already exposes them via `data.stars`.
- **npm version / publish time** — `GET /npm` / `npm.packages.*` from `registry.npmjs.org`.
- **Marketplace installs / rating** — use Microsoft’s reporting or badges, or Open VSX API (`GET https://open-vsx.org/api/{namespace}/{name}`) if you publish there. You *can* add a future route (e.g. `GET /marketplace`) in this worker that proxies Open VSX or a small cache — keep it separate from npm to avoid mixing sources.

If you want a single **npm** row for “extension”, publish a tiny meta package (e.g. `i18nprune-vscode`) whose version tracks the VSIX, or point `NPM_EXTENSION_PACKAGE` at whatever you actually publish to npm.

## Local dev

```bash
cd apps/workers/meta
pnpm install
pnpm dev
```

## Deploy

```bash
cd apps/workers/meta
pnpm deploy
```

Optional `GITHUB_TOKEN` secret for higher GitHub API rate limits:

```bash
wrangler secret put GITHUB_TOKEN
```

Optional npm name overrides (vars), e.g. in `wrangler.jsonc`:

```jsonc
"vars": {
  "NPM_EXTENSION_PACKAGE": "your-vscode-meta-package"
}
```

## Implementation notes

- GitHub coordinates live in `src/constants/github.ts` — keep them aligned with `packages/core/src/shared/constants/links.ts` (repo URLs). The public worker origin is **`META_WORKER_URL`** in core (`https://meta.i18nprune.dev`).
- The worker does not import `@i18nprune/core` / CLI packages (keeps `tsc` small for this app).
