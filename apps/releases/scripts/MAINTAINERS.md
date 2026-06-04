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
