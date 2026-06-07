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

Writes (gitignored — run before dev/build):

- `src/data/releases.json`
- `public/data/releases.json`
- `public/feed.xml`, `public/atom.xml`, `public/sitemap.xml`

`SITE_ORIGIN` defaults to `https://releases.i18nprune.dev`.

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
