---
description: Machine-readable release data for the CLI and Core SDK — JSON endpoints on the releases portal, the record shape, content negotiation, and feeds for agents, CI, and scripts.
---

# Release data (machine-readable)

The [releases portal](https://releases.i18nprune.dev) is a single-page app: its HTML routes
(`/cli/1.1.1`) render in a browser but carry nothing a script can parse. Every release is
therefore also published as **static JSON** under `/releases/`, so agents, CI, and the CLI
can read release notes without scraping the SPA.

## Endpoints

All paths are relative to `https://releases.i18nprune.dev`.

| Endpoint | Returns |
|----------|---------|
| `/releases/index.json` | Full catalog — every stream, every version |
| `/releases/<stream>/latest.json` | The newest release record for a stream |
| `/releases/<stream>/<version>.json` | One release record |

`<stream>` is `cli`, `core`, or `extension`. The catalog is `schemaVersion: 1`.

```bash
# newest CLI release
curl -s https://releases.i18nprune.dev/releases/cli/latest.json | jq '{version, summary}'

# the fixed items in a specific version
curl -s https://releases.i18nprune.dev/releases/cli/__I18NPRUNE_VERSION__.json | jq '.sections.fixed'
```

## Content negotiation

The canonical human route doubles as a data route: request `/cli/1.1.1` with
`Accept: application/json` and the portal returns that release's record. Browsers (which
send `Accept: text/html`) still get the SPA, so the same URL works for people and tools.

```bash
curl -s -H 'Accept: application/json' \
  https://releases.i18nprune.dev/cli/__I18NPRUNE_VERSION__
```

## Record shape

Each `latest.json` and `<version>.json` is one release record — the same object stored in
the catalog:

| Field | Notes |
|-------|-------|
| `schemaVersion` | `1` |
| `stream` | `cli` · `core` · `extension` |
| `version` | semver |
| `date` | `YYYY-MM-DD` |
| `status` | `stable` · `prerelease` · `deprecated` |
| `summary` | one-line overview |
| `highlights` | optional bullet list |
| `sections` | `added` · `changed` · `fixed` · `removed` · `breaking` · `security` · `performance` |
| `migration` | `notes[]` plus optional `docLinks[]` (`{ label, href }`) |
| `npm` | `package`, `installSnippet` |
| `git` | `tag`, optional `githubReleaseUrl` |
| `compat` | optional cross-stream version pins (`{ stream, version }` or `{ stream, minVersion }`) |
| `tags` | optional labels |

## Feeds

| Feed | URL |
|------|-----|
| RSS 2.0 | `https://releases.i18nprune.dev/feed.xml` |
| Atom | `https://releases.i18nprune.dev/atom.xml` |
| Sitemap | `https://releases.i18nprune.dev/sitemap.xml` |

## Legacy path

`/data/releases.json` — the catalog's location before 2026-W42 — 301-redirects to
`/releases/index.json`.

## See also

- [JSON output (`--json`)](./cli/json.md) — the CLI's own machine contract
- [Update checks & version throttle](./cli/cache.md)
