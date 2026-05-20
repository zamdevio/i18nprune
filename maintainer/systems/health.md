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
| **Optional diagnostics** | `pnpm madge:orphans` · `pnpm madge:leaves` · `pnpm empty:dir` · `pnpm empty:file` |
| **Optional cleanup (manual review first)** | `pnpm empty:dir:del` · `pnpm empty:file:del` |

Hygiene-only fixes (knip/madge/empty) belong in **dedicated PRs** or the same PR only when you already changed module structure — do not bundle unrelated behavior changes.

---

## Required gates

### `pnpm typecheck`

Root `tsc --noEmit` across the monorepo TypeScript project references. Run after any type or import change.

### `pnpm test`

`vitest run` — unit, integration, and parity tests. Refactors that touch CLI JSON, stderr, exit codes, or issue codes must keep **`tests/parity/`** byte-for-byte stable unless the slice explicitly changes contract.

---

## Structure-change gates

Run these when you touch **`packages/core/src`**, **`packages/cli/src`**, or barrels under **`packages/report/src`**.

### `pnpm madge:circular`

Detects import cycles in:

```txt
packages/core/src
packages/cli/src
packages/report/src
```

**When:** new cross-module imports, barrel re-exports, moving files between folders.

**Fix strategy:** sibling modules in the same folder import from **leaf files** (`./delta.js`, `./rebuild.js`), **not** from the folder **`index.ts` barrel**. The barrel re-exports for external consumers; **call sites import from the barrel**. Example:

```txt
types/cache/delta.ts      ← leaf types (no barrel import)
types/cache/rebuild.ts    ← imports ./delta.js
types/cache/index.ts      ← re-exports for @i18nprune/core consumers
```

### `pnpm knip`

Dead code, unused exports, unused/missing dependencies. Config: [`knip.json`](../../knip.json). Ignore catalog and workspace overrides: **[`knip.md`](./knip.md)**.

**When:** deleted files, new dependencies, changed entrypoints, new public barrels, edge-only entries (Cloudflare functions).

**Knip + static imports:** prefer top-level `import` over dynamic `import('pkg/subpath')` when the dependency must stay visible to knip (see Shiki pattern in [`knip.md`](./knip.md)).

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
| Agent onboarding / architecture summary | [`maintainer/agents/architecture.md` § 8](../agents/architecture.md#8-health-gates) (pointer only) |

---

## Related

- [`maintainer/agents/architecture.md` § 8](../agents/architecture.md#8-health-gates) — short pointer for agents
- [`maintainer/agents/git.md`](../agents/git.md) — pre-push / commit discipline
- [`.cursor/rules/i18nprune.mdc`](../../.cursor/rules/i18nprune.mdc) — workspace rule: `pnpm typecheck` + `pnpm test` before commit
