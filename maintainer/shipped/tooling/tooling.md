# Tooling & planning (W25–W26)

## 2026-W26 · Tooling & kits prep

| Slice | Receipt |
|-------|---------|
| **Publish preflight** | `expgov validate` green; tsconfig ↔ npm exports allowlist; `.github/workflows/exports.yml` — [`exports/governance.md`](./exports/governance.md) |
| **Exports worktree** | Cache isolated under `__worktree__` (`exports:diff` without `-f`) |
| **Kits v1.0.0** | Native `i18nprune kits` shipped W28 — [`kits/kits.md`](./kits/kits.md) |
| **pnpm v11** | Overrides moved from `package.json` to `pnpm-workspace.yaml` |
| **expgov** | `@expgov/cli` + root `expgov.config.ts` (replaces `scripts/exports` host) |

## 2026-W25 · Planning & exports governance

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **Governance bootstrap** | Export inventory via expgov; `.exports/cache/` | [`systems/exports.md`](../../systems/exports.md) · [`exports/governance.md`](./exports/governance.md) |
| **Extractor phases** | Hub under `maintainer/phases/extractor/` | [`extractor/README.md`](../../phases/extractor/README.md) |
| **Search phase** | Read-only key ↔ call-site plan | [`search.md`](../../phases/search.md) |
| **Extension** | esbuild externalizes `@i18nprune/core` + `jiti` | `apps/extension/` |
| **Positioning** | Pre-v1 / extension-coming-soon copy | [`marketing/positioning.md`](../../marketing/positioning.md) |
