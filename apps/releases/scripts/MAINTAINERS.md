# Maintainer scripts (`apps/releases/scripts`)

```text
scripts/
  validate.ts              # schema + compat rules on content/
  generate.ts              # YAML → catalog JSON + RSS/Atom/sitemap
  github-release-body.ts   # paste-ready GitHub Release markdown
  lib/
    utils.ts               # paths, load YAML, siteOrigin, version index
    build.ts               # feed.xml, atom.xml, sitemap.xml
    rules.ts               # compat validation between releases
    helpers.ts             # Ajv error formatting, identity checks
```

| `package.json` script | File |
|-----------------------|------|
| `pnpm validate` | `validate.ts` |
| `pnpm generate:catalog` | `generate.ts` |
| `pnpm github-release-body` | `github-release-body.ts` |

## `pnpm generate:catalog`

Writes:

- `src/data/releases.json` — catalog bundled into the SPA *(gitignored)*
- `public/releases/index.json` — full catalog for external consumers *(gitignored)*
- `public/releases/<stream>/latest.json` — newest record per stream *(gitignored)*
- `public/releases/<stream>/<version>.json` — one record per release *(gitignored)*
- `public/feed.xml`, `public/atom.xml`, `public/sitemap.xml` *(gitignored)*
- **`CHANGELOG.md`** — generated at the **monorepo root** and **committed**

`SITE_ORIGIN` defaults to `https://releases.i18nprune.dev`.

### Machine-readable surface (`/releases/…`)

The portal is an SPA, so its HTML routes (`/cli/1.1.1`) are unparseable to scripts. Every
release is therefore also emitted as static JSON under `/releases/`:

```text
https://releases.i18nprune.dev/releases/index.json           # catalog (all streams)
https://releases.i18nprune.dev/releases/cli/latest.json      # newest CLI record
https://releases.i18nprune.dev/releases/cli/1.1.1.json       # one release record
```

Per-version and `latest` files hold a raw `ReleaseRecordV1` (same shape as catalog
entries). `functions/_middleware.ts` also content-negotiates the canonical route: a request
to `/cli/1.1.1` with `Accept: application/json` returns that record; browsers still get the
SPA shell. The pre-rename `/data/releases.json` is 301'd to `/releases/index.json`.

### `CHANGELOG.md` is generated — never hand-edit

The monorepo-root `CHANGELOG.md` is rendered from `content/**/*.yaml` by the same script.
Edit the YAML, run `pnpm releases:generate`, and commit the regenerated file. CI fails if it
drifts from the YAML (`pnpm releases:generate && git status --porcelain CHANGELOG.md`).

## `pnpm github-release-body`

```bash
pnpm github-release-body -- --stream cli --version 1.2.0
```

## IndexNow (after deploy — manual, not on git push)

Shared **public** verification key (`INDEXNOW_PUBLIC_KEY` in `@i18nprune/seo`). Each host serves:

```text
apps/releases/public/7e4a9c1f2b8d6e3a5c0f1b9d8e7a6c4.txt
apps/landing/public/7e4a9c1f2b8d6e3a5c0f1b9d8e7a6c4.txt
apps/docs/.vitepress/public/7e4a9c1f2b8d6e3a5c0f1b9d8e7a6c4.txt
apps/git/public/7e4a9c1f2b8d6e3a5c0f1b9d8e7a6c4.txt
```

Set the same value in env / GitHub secret `INDEXNOW_KEY` (do not log in CI).

```bash
# Releases — same version on all streams that have YAML (extension auto-skipped if missing)
INDEXNOW_KEY=7e4a9c1f2b8d6e3a5c0f1b9d8e7a6c4 pnpm indexnow:releases -- --version 0.1.3 --dry-run

# Releases — per-stream versions (run separate pings when cli/core semver diverge)
pnpm indexnow:releases -- --stream cli:0.1.3 --dry-run
pnpm indexnow:releases -- --stream core:0.1.4 --dry-run
pnpm indexnow:releases -- --stream cli:0.1.3,core:0.1.4 --dry-run

# Docs / landing / git — after respective *:deploy (home + sitemap.xml)
pnpm indexnow:docs -- --dry-run
pnpm indexnow:landing -- --dry-run
pnpm indexnow:git -- --dry-run
```

GitHub: **Actions → IndexNow ping** (`workflow_dispatch`, default `dry_run=true`). Not triggered on push.

Implementation: `packages/seo` (`submitIndexNow`) · `scripts/indexnow/` · `.github/workflows/indexnow.yml`.
