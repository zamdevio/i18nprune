# Codebase health gates

**Audience:** Maintainers and agents — what to run before commit, after refactors, and when diagnosing repo hygiene.  
**Scripts:** [`package.json`](../../package.json) (`knip`, `madge:*`, `typecheck`, `test`, `empty:*`).  
**Deep dive (knip config):** [`knip.md`](./knip.md).

---

## Quick checklist

| When | Run |
|------|-----|
| **Every commit that changes TS** | `pnpm typecheck` · `pnpm test` |
| **Moved/renamed/deleted files or changed barrels** | `pnpm madge:circular` · `pnpm knip` |
| **Refactor PR (parity-sensitive)** | Above + `tests/parity/` must pass |
| **Changed root `exports` / `dist/*.d.ts` / npm pack layout** | `pnpm run publish:verify` (see `tests/publish-types/fixture/README.md`) |
| **Changed `@i18nprune/core` publish `exports` / SDK build** | `pnpm run core:build` · dry-run `npm pack` in `packages/core` |
| **Optional diagnostics** | `pnpm madge:orphans` · `pnpm madge:leaves` · `pnpm empty:dir` · `pnpm empty:file` |
| **Optional cleanup (manual review first)** | `pnpm empty:dir:del` · `pnpm empty:file:del` |

Hygiene-only fixes (knip/madge/empty) belong in **dedicated PRs** or the same PR only when you already changed module structure — do not bundle unrelated behavior changes.

---

## Required gates

### `pnpm typecheck`

Root orchestrator: **`pnpm typecheck`** → Turborepo runs **`@i18nprune/core#build`** then workspace **`typecheck`** tasks (required because `@i18nprune/core` **`exports`** target **`dist/`**, not `src/`). Per-package scripts (`web:typecheck`, `meta:typecheck`, …) need **`packages/core/dist`** unless you run **`pnpm run core:build`** first. Run the umbrella command before commit, or a single target while iterating on one app.

### `pnpm build`

Production artifact chain: **`cli:build`** (includes report SPA bundle for embedded HTML), **`web:build`**, **`landing:build`**, **`docs:build`**, **`ext:build`**, worker compile gates. The report SPA is **not** built twice — root **`build`** omits standalone **`report:build`** because **`cli:build`** already runs it.

### `pnpm test`

`vitest run` — unit, integration, and parity tests. Refactors that touch CLI JSON, stderr, exit codes, or issue codes must keep **`tests/parity/`** byte-for-byte stable unless the slice explicitly changes contract.

---

## Structure-change gates

Run these when you touch **`packages/core/src`**, **`packages/cli/src`**, **`packages/ui/src`**, **`packages/seo/src`**, or runtime app sources under **`apps/*/src`**.

### `pnpm madge:circular`

Detects import cycles in:

```txt
packages/core/src
packages/cli/src
packages/ui/src
packages/seo/src
apps/landing/src
apps/web/src
apps/report/src
apps/releases/src
apps/extension/src
apps/extension/src/webview/src
apps/workers/i18nprune/src
apps/workers/meta/src
```

Scan roots are centralized in [`scripts/madge/run.mjs`](../../scripts/madge/run.mjs). **`apps/docs`** (VitePress) is omitted — mostly markdown with thin `.vitepress` config, not a TS module graph.

**Pages `/og.svg` / `/og.png`:** served by Cloudflare **Functions** (`apps/*/functions/og.svg.ts`), not the Vite `dist/` SPA. At deploy, Wrangler bundles `@i18nprune/seo/og` from **`packages/seo/dist/`**. Run **`pnpm seo:build`** before deploy (Pages apps **`prebuild`** hooks do this automatically) — editing `packages/seo/src/og/ogCard.ts` alone does not update production OG until `dist/` is rebuilt and redeployed.

**Madge “Skipped @i18nprune/seo” warning:** madge resolves workspace imports via root [`tsconfig.json`](../../tsconfig.json) `paths`. Without `@i18nprune/seo` / `@i18nprune/ui` entries, imports from `packages/ui` skip the seo package and madge prints `(1 warning)`.

**When:** new cross-module imports, barrel re-exports, moving files between folders.

**Madge alias skips (~62 with apps in scope):** unresolved `@/` (releases), `@shikijs/*`, and Vite-only aliases — not cycles; safe to ignore unless you add per-app `tsconfig` paths to root.

**Fix strategy:** sibling modules in the same folder import from **leaf files** (`./delta.js`, `./rebuild.js`), **not** from the folder **`index.ts` barrel**. The barrel re-exports for external consumers; **call sites import from the barrel**. Example:

```txt
types/cache/delta.ts      ← leaf types (no barrel import)
types/cache/rebuild.ts    ← imports ./delta.js
types/cache/index.ts      ← re-exports for @i18nprune/core consumers
```

### `pnpm ui:purity`

Forbidden import guard for `@i18nprune/ui` — no `@i18nprune/core`, workers, `react-router-dom`, `hono`, `zod`, `fflate`. Script: [`scripts/ui/purity-check.mjs`](../../scripts/ui/purity-check.mjs). Rules: [`ui.md`](./ui.md).

**When:** any change under `packages/ui/`. Included in root `pnpm typecheck`.

### `pnpm knip`

Dead code, unused exports, unused/missing dependencies. Config: [`knip.json`](../../knip.json). Ignore catalog and workspace overrides: **[`knip.md`](./knip.md)**.

**Knip won't start** (missing `@oxc-parser/binding-*`): run **`pnpm install`** — see [`knip.md` § Knip fails to start](./knip.md#knip-fails-to-start-oxc-parserbinding--missing).

**When:** deleted files, new dependencies, changed entrypoints, new public barrels, edge-only entries (Cloudflare functions).

**Knip + static imports:** prefer top-level `import` over dynamic `import('pkg/subpath')` when the dependency must stay visible to knip (see Shiki pattern in [`knip.md`](./knip.md)).

### Root `madge` devDependency

`pnpm madge:*` runs [`scripts/madge/run.mjs`](../../scripts/madge/run.mjs), which resolves the local CLI via `require.resolve('madge/bin/cli.js')` (no global install). Knip recognizes **`madge`** through root **`package.json`** scripts (`madge:circular`, etc.) — no extra `entry` or `ignoreDependencies` needed.

---

## Madge diagnostics (optional)

Same scan roots as `madge:circular`. Not required before every commit — use when exploring dead modules or extraction candidates.

| Command | Purpose |
|---------|---------|
| **`pnpm madge:orphans`** | Files not imported by anything (potential dead code) |
| **`pnpm madge:leaves`** | Modules with no outgoing imports (good extraction candidates) |

Cross-check orphans with **`pnpm knip`** before deleting — knip understands entry graphs and workspace boundaries madge does not.

---

## Repo hygiene (optional)

Ad-hoc helpers after large deletes or directory reshuffles. Not CI gates.

| Command | Purpose |
|---------|---------|
| **`pnpm empty:dir`** | List empty directories (skips `node_modules`, `.git`, `wrangler`) |
| **`pnpm empty:file`** | List zero-byte files (same skips) |
| **`pnpm empty:dir:del`** | Delete empty directories after printing each path (same skip policy) |
| **`pnpm empty:file:del`** | Delete zero-byte files after printing each path (same skip policy) |

Use to clean up leftover folders from moves; prefer `empty:dir` / `empty:file` first, then run delete variants only when you have reviewed output. Always verify with `git status` after cleanup.

---

## Barrel import discipline (shared)

Applies to **knip**, **madge**, and day-to-day imports:

1. **Domain folder** exposes a public surface via **`index.ts`** (re-exports).
2. **Call sites** (other packages, CLI, tests) import from the **barrel** or `@i18nprune/core` — not deep paths into sibling implementation files.
3. **Sibling modules in the same folder** import from **leaf files** only — never `./index.js` — to avoid circular dependencies.

Public API barrels listed in [`knip.md`](./knip.md) are **ignored by knip** because external hosts consume them outside the in-repo graph.

---

## When to update docs

| Change | Update |
|--------|--------|
| New **`package.json`** health script | This file |
| New **`knip.json`** ignore or workspace rule | [`knip.md`](./knip.md) |
| `@i18nprune/ui` boundaries or migration phase | [`ui.md`](./ui.md) |
| Agent onboarding / architecture summary | [`maintainer/agents/architecture.md` § 8](../agents/architecture.md#8-health-gates) (pointer only) |

---

## Related

- [`maintainer/agents/architecture.md` § 8](../agents/architecture.md#8-health-gates) — short pointer for agents
- [`maintainer/agents/git.md`](../agents/git.md) — pre-push / commit discipline
- [`.cursor/rules/i18nprune.mdc`](../../.cursor/rules/i18nprune.mdc) — workspace rule: `pnpm typecheck` + `pnpm test` before commit
