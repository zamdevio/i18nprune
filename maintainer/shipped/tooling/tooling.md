# Tooling & planning (W25–W26)

## 2026-W26 · Tooling & kits prep

| Slice | Receipt |
|-------|---------|
| **EX-P0** | `expgov validate` green; tsconfig ↔ npm exports allowlist; `.github/workflows/exports.yml` |
| **Exports worktree** | Cache isolated under `__worktree__` (`exports:diff` without `-f`) |
| **Kits v1.0.0** | Native `i18nprune kits` shipped W28 — [`shipped/kits/kits.md`](../../shipped/kits/kits.md) |
| **pnpm v11** | Overrides moved from `package.json` to `pnpm-workspace.yaml` |
| **expgov** | `@expgov/cli` + root `expgov.config.ts` (replaces `scripts/exports` host) |

## 2026-W25 · Planning & exports governance

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **EX-0** | Export inventory governance; `.exports/cache/`; tier rules | [`systems/exports.md`](../../systems/exports.md) |
| **Extractor phases** | Hub under `maintainer/phases/extractor/` | [`extractor/README.md`](../../phases/extractor/README.md) |
| **Search phase** | Read-only key ↔ call-site plan | [`search.md`](../../phases/search.md) |
| **Extension** | esbuild externalizes `@i18nprune/core` + `jiti` | `apps/extension/` |
| **Positioning** | Pre-v1 / extension-coming-soon copy | [`marketing/positioning.md`](../../marketing/positioning.md) |
