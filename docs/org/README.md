# npm scope & organization (future)

**Status:** planning only — **no package rename or publish changes are in progress.**

## Today

The published CLI and programmatic entrypoints remain under the **`@zamdevio`** scope on npm (e.g. **`@zamdevio/i18nprune`**). Documentation, registry URLs in the tool, and install commands continue to match that name until a deliberate migration.

## Future (when it becomes worth the churn)

The **`@i18nprune`** npm organization is reserved for a possible **full-org** layout. A migration could include:

- **Scope move** — publish under **`@i18nprune/…`** (exact package names TBD) with a semver-major bump and a clear changelog for consumers (`package.json` dependencies, CI caches, global installs).
- **Optional split** — separate **CLI** and **SDK**-style surfaces (e.g. distinct packages or repos) if the project outgrows a single tarball; the monorepo today already keeps **source** in **`packages/cli`** vs shared **`packages/report`** without requiring multiple npm packages.
- **Docs & tooling** — one pass on all user-facing strings: `npm i -g`, `defineConfig` import paths, report HTML deep links, and version-check registry URLs.

Until then, treat this page as **maintainer intent**, not a roadmap commitment. Update it when the migration is scheduled.

## See also

- [Vision](../vision/README.md) — product direction
- [Roadmap](../roadmap/README.md) — planned work
