# Knip — config and ignore catalog

**Audience:** Maintainers updating [`knip.json`](../../knip.json) or debugging knip false positives.  
**When to run knip:** [`health.md`](./health.md) (checklist + barrel discipline).  
**Config:** [`knip.json`](../../knip.json) at repo root.

---

## What knip does

[`knip`](https://knip.dev/) scans the monorepo for:

- Unused files and exports
- Unused or missing dependencies
- Unlisted dependencies (imports without a matching `package.json` entry)

```bash
pnpm knip
```

Run after deleting files, moving modules, changing barrels, or adding packages — same timing as **`pnpm madge:circular`** (see [`health.md`](./health.md)).

---

## `knip.json` layout

| Key | Purpose |
|-----|---------|
| **`ignore`** | Entire files excluded from analysis (see below). |
| **`ignoreExportsUsedInFile`** | Re-export-only barrels do not flag “unused export” when the export is only consumed elsewhere. |
| **`ignoreBinaries`** | Shell utilities invoked only from root `package.json` scripts (`files`, `lines` use `printf` / `awk` via `find` + `wc`). |
| **`workspaces`** | Per-package entry globs, project scope, and workspace-local `ignoreDependencies`. |

Root config applies to the whole repo; nested keys under **`workspaces`** tune **`apps/landing`**, **`apps/extension`**, **`apps/extension/src/webview`**, and **`packages/ui`**.

---

## Knip fails to start (`@oxc-parser/binding-*` missing)

Knip 6 depends on **oxc-parser**, which ships **optional native bindings** per platform. After a clone, partial install, or platform switch (e.g. WSL), you may see:

```txt
Error: Cannot find module '@oxc-parser/binding-linux-x64-gnu'
```

**Fix:** reinstall workspace deps so pnpm resolves the correct optional binding for your OS/arch:

```bash
pnpm install
```

If it persists, remove **`node_modules`** at the repo root and run **`pnpm install`** again. No code change required — this is an install graph / optional-dependency issue, not a project source error.

---

## Ignored files (`ignore`)

### Fixtures and examples

| Path | Why |
|------|-----|
| `tests/fixtures/**` | Parity and integration fixtures; not production entrypoints. |
| `tests/publish-types/fixture/**` | Manual npm-consumer smoke for packed `i18nprune` types; see `tests/publish-types/fixture/README.md`. |
| `examples/sdk/**` | SDK samples for docs; not wired into knip entry graph. |
| `i18nprune.config.ts` | Root dogfood config for local runs. |

### Public API barrels (`packages/core/src/**/index.ts`)

These **`index.ts`** files are **intentionally ignored as files** because knip’s entry graph does not see external consumers:

| File | Role |
|------|------|
| `packages/core/src/extractor/index.ts` | Extractor namespace for SDK / extension / worker hosts |
| `packages/core/src/runtime/index.ts` | Runtime adapter barrels (`node`, `web`, `edge`) |
| `packages/core/src/runtime/factory/index.ts` | Factory re-exports |
| `packages/core/src/runtime/guards/index.ts` | Host guard helpers |

**Why ignore instead of deleting exports:** Hosts import from `@i18nprune/core` or subpath exports. Those barrels aggregate stable public surface; knip only walks in-repo importers and would report every re-export as unused.

**In-repo rule:** call sites import from the **barrel**; sibling modules use **leaf files** only — see [`health.md` § Barrel import discipline](./health.md#barrel-import-discipline-shared).

### Cloudflare Pages Functions (shared OG + redirects)

| Path | Why |
|------|-----|
| `apps/*/functions/**` | Pages **Functions** routes (`/og.svg`, `/og.png`, `_middleware.ts`); synced from `packages/seo/functions/` at build — outside the Vite `src/**` graph. |

Canonical OG handler sources live in **`packages/seo/functions/`** (knip sees them via `syncPagesFunctions` in `packages/seo/src/assets/sync.ts`).

OG fonts ship as static files under each app `public/fonts/og/` (synced from `packages/seo/assets/fonts/og/`). Favicons sync from `packages/seo/assets/favicon/`.

### `@i18nprune/seo` (OG PNG + Workers types)

| Package | Why |
|---------|-----|
| `@resvg/resvg-wasm` | WASM rasterizer for `/og.png` (Pages bundle via `@i18nprune/seo/og`). |
| `@cloudflare/workers-types` | Triple-slash refs in Pages function sources and `packages/seo/src/pages/**`. |

### `apps/landing` (and other Pages apps)

| Package | Why |
|---------|-----|
| `@cloudflare/workers-types` | Triple-slash `/// <reference types="@cloudflare/workers-types" />` in `functions/_middleware.ts` — knip does not count reference directives as import edges. Same pattern for `apps/web`, `apps/report`, `apps/docs`, `apps/releases`. |

---

## Shiki / `@shikijs/*` (no longer ignored)

Previously, dynamic `import('@shikijs/langs/…')` hid dependencies from knip. **Fix:** static top-level imports in:

- `apps/extension/src/webview/src/lib/shiki.ts`
- `apps/landing/src/lib/shikiHighlighter.ts`

Pass imported grammars/themes into `createBundledHighlighter` / `createHighlighterCore` via getters. **No shiki-related knip ignores remain.**

---

## `ignoreExportsUsedInFile: true`

When a file both defines and re-exports symbols only used elsewhere (typical barrel), knip would otherwise flag those exports as unused **in that file**. Matches our barrel pattern.

---

## When to update this doc

- New **public barrel** knip should ignore → row in [Public API barrels](#public-api-barrels-packagescoresrcindexts).
- New **edge entry** outside Vite/CLI graph → `ignore` + rationale here.
- New **type-only** or **triple-slash** dependency knip cannot see → `ignoreDependencies` + rationale.
- Removing an ignore → prefer fixing imports/entries first (Shiki pattern above).

---

## Checklist (knip-specific)

1. `pnpm knip` — no unexpected unused deps/files after your change.
2. If you add a knip ignore, document it in this file in the same PR.
3. `pnpm madge:circular` — see [`health.md`](./health.md) (knip does not detect cycles).
