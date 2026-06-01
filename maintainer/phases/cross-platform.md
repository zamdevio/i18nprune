# Cross-platform hardening (CLI + SDK)

**Status:** **Active next** — apps C.3+ rows **0–10** shipped ([`shipped-slices.md`](./shipped-slices.md) · [`systems/share.md`](../systems/share.md)).  
**Hub:** [`V1-RELEASE.md`](./V1-RELEASE.md) · **Active narrative:** [`active-phase.md`](./active-phase.md) · **Then:** [`tree.md`](./tree.md)  
**Audit baseline:** CLI + `packages/core` portability review (2026-05) — architecture is **mostly safe**; **CI and proof** are Linux-first today.

**Promise (one sentence):** With **Node ≥ 18**, the **CLI** and **`@i18nprune/core` SDK** run deterministically on **Windows, macOS, native Linux, and WSL** for local scan, **all disk caches**, and report generation — without shell-specific commands or POSIX-only path logic in **core**.

**PR discipline:** one tracker row per PR · `pnpm typecheck` · `pnpm test` · `pnpm vitest run tests/parity` when CLI output changes.

---

## Not in scope (other phases)

| Area | Phase |
|------|--------|
| Report SPA editor deep links / viewer matrix | [`apps/report`](../../apps/report) (shipped row 8; policy in runtime) |
| Worker grouped metadata envelopes | [`systems/share.md`](../systems/share.md) (shipped row W) |
| Extension host | [`extension/README.md`](./extension/README.md) |
| Hosted `webPathRuntime` / edge prepare | [`systems/share.md`](../systems/share.md) — document boundaries only |

---

## Disk surfaces (all must be audited)

Three **CLI-owned** on-disk areas + **one core-owned** layout under a configurable root. Do **not** conflate them.

| Surface | Default location (CLI) | Owner | Purpose |
|---------|------------------------|-------|---------|
| **Version / update cache** | `$XDG_CONFIG_HOME/i18nprune/updatestate.json` or `~/.config/i18nprune/updatestate.json` | **CLI only** (`packages/cli/src/utils/update/`) | npm registry throttle + latest version snapshot; **not** in core |
| **Project + analysis + translate cache** | `~/.i18nprune/cache/` → `projects/<id>/` | **Core** policy + **CLI** default root (`packages/cli/src/shared/cache/`, `packages/core/src/cache/`) | `meta.json`, `files.json`, `analysis.json`, `translations/<code>.json` |
| **Per-project cache id** | Hash of normalized **project root** path | **Core** (`packages/core/src/cache/io/hash.ts`) | Stable `projects/<16-char-hex>/` segment |

**Code map — version cache**

| File | Role |
|------|------|
| `packages/cli/src/utils/update/paths.ts` | `getConfigDir()` — `XDG_CONFIG_HOME` or `path.join(os.homedir(), '.config', 'i18nprune')` |
| `packages/cli/src/utils/update/cache.ts` | Read/write `updatestate.json`; schema v1 |
| `packages/cli/src/constants/update.ts` | `UPDATE_STATE_SCHEMA_VERSION`, throttle interval |
| `packages/cli/src/utils/update/index.ts` | Entry: `maybeCheckForUpdate` (skipped in CI / `--json` / `I18NPRUNE_NO_UPDATE_CHECK`) |

**Code map — project / translate cache**

| File | Role |
|------|------|
| `packages/cli/src/shared/cache/runtime.ts` | `defaultCliCacheRootDir()` → `~/.i18nprune/cache`; `buildCliCacheRuntime`, atomic `writeTextAtomic` |
| `packages/cli/src/shared/cache/paths.ts` | Wire core `initializeCacheState` / `resolveCacheState` |
| `packages/core/src/cache/setup/paths.ts` | `resolveCacheState`, `initializeCacheState` |
| `packages/core/src/cache/io/hash.ts` | `computeCacheProjectId` (lowercased normalized root) |
| `packages/core/src/translator/cache/paths.ts` | `translations/` under `projectDir` |

**Important:** Core does **not** read `updatestate.json`. Version cache is **CLI-only**. Cross-platform work must test **both** roots on Windows.

---

## Current readiness (baseline)

| Runtime | CLI + SDK | Notes |
|---------|-----------|--------|
| **Native Linux** | **Likely works** | Primary CI (`ubuntu-latest`) |
| **WSL** | **Likely works** | Node `platform: linux`; paths are Linux inside distro |
| **macOS** | **Mostly safe** | Node adapters; not in CI |
| **Windows (CMD / PS / Terminal)** | **Mostly safe, unproven** | `node:path` / `node:fs`; no `rm`/`cp` on main path; optional `rg` on PATH |
| **Windows native vs WSL cross-host** | **Out of promise** | Do not assume paths cross boundaries |

**Confidence today:** **mostly cross-platform safe, Linux-first validation** — not production-grade cross-platform until **XP-1** (CI matrix) lands.

---

## Hidden risks (prioritize in slices)

| Risk | Layer | Severity |
|------|-------|----------|
| **CI Linux-only** | Repo | High — no automated Windows/macOS signal |
| **Cache project id lowercasing** | Core `cache/io/hash.ts` | Medium — correct on Windows FS; differs from Linux case-sensitive trees |
| **Symlink cycles in source walk** | Core `shared/scanner/files.ts` | Medium — all OSes |
| **Atomic cache write** (`tmp` + `rename` same dir) | CLI `buildCliCacheRuntime` | Low–medium — verify on Windows project cache dir |
| **Config dir `.config` under homedir** | CLI update paths | Low — works on Windows; not `%APPDATA%`; document actual paths |
| **Archive report fake env** (`osRelease: '0'`) | Core `prepare/fromArchiveReport.ts` | UX/metadata — not runtime failure |
| **Optional `rg`** | CLI `utils/rg` | Medium for cleanup quality — `rg.exe` on PATH |
| **`webPathRuntime`** misuse | Core | Low if limited to browser/worker hosts |

---

## Tracker

| # | Slice | Status | Notes |
|---|-------|--------|-------|
| **XP-0** | Audit receipt + Windows checklist in this doc | **Todo** | Fold in agent audit; link from `docs/cli/cache.md` when touched |
| **XP-1** | CI: `windows-latest` smoke (+ optional `macos-latest`) | **Todo** | `pnpm typecheck`, core tests, CLI subset; no new OS logic in first PR |
| **XP-2** | **Project cache** hardening | **Todo** | Atomic writes, `cacheRootDir` override docs, symlink guard in `listSourceFiles`, project-id policy note |
| **XP-3** | **Version cache** (`updatestate.json`) hardening | **Todo** | Document paths on Win/macOS/Linux; verify `mkdirp` + read/write; `XDG_CONFIG_HOME` on Windows when set |
| **XP-4** | **Translate cache** (`translations/*.json`) | **Todo** | Same `projectDir` as analysis; confirm L2 IO on Windows paths |
| **XP-5** | Report host metadata | **Todo** | Fix archive placeholder env; CLI `buildReportEnvironmentSnapshot` truth on all platforms |
| **XP-6** | User docs | **Todo** | `docs/cli/cache.md` — three disk surfaces, paths on Windows, WSL vs native Node |
| **XP-7** | Optional: spaces-in-path fixture test | **Todo** | One integration test on Windows CI |

---

## Slice detail

### XP-2 — Project cache (`~/.i18nprune/cache`)

- [ ] Confirm `defaultCliCacheRootDir()` and overrides behave on Windows (`C:\Users\…\.i18nprune\cache`).
- [ ] Document `config.cache` / CLI cache root override if present in config (align with `docs/cli/cache.md`).
- [ ] Verify `writeTextAtomic` in `packages/cli/src/shared/cache/runtime.ts` on Windows (same-volume rename).
- [ ] Add symlink cycle guard (or depth cap) in `listSourceFiles` walk.
- [ ] Document `computeCacheProjectId` lowercasing policy (Windows case-insensitivity vs Linux).

### XP-3 — Version cache (`updatestate.json`)

- [ ] Document resolution order: `$XDG_CONFIG_HOME/i18nprune/` → `~/.config/i18nprune/`.
- [ ] Verify create/read/write/delete on Windows (user-visible path e.g. `%USERPROFILE%\.config\i18nprune\updatestate.json`).
- [ ] Confirm `I18NPRUNE_NO_UPDATE_CHECK` / `CI` skip still correct on all platforms.
- [ ] **Do not** move version state into core unless product explicitly requests — keep CLI-owned.

### XP-4 — Translate cache

- [ ] Confirm `projects/<id>/translations/<locale>.json` layout uses adapter `path.join` only.
- [ ] Invalidate/heal paths (`translator/cache/maintenance.ts`) on Windows.
- [ ] Cross-link H.1 shipped behavior — same `config.cache` gate as analysis.

### XP-5 — Report environment metadata

- [ ] Replace or omit fake `environment` in `fromArchiveReport` (`osRelease: '0'`, etc.).
- [ ] Ensure CLI `buildReportEnvironmentSnapshot` uses `os.release()` on win32/darwin/linux/WSL.

---

## Windows readiness checklist

| Check | Command / action |
|-------|------------------|
| Node ≥ 18 on PATH | `node -v` |
| Install / run CLI | `pnpm i18nprune` or `npx i18nprune` |
| Doctor | `i18nprune doctor` (note `rg` warn if missing) |
| Validate sample project | `i18nprune validate --json` |
| Cache write | second run shows cache hit / debug-cache |
| Version state file | after run: dir exists under `.config\i18nprune\` with `updatestate.json` |
| Report HTML | `i18nprune report --format html` |
| Share (optional) | `i18nprune share upload` if worker configured |

---

## SDK boundaries (locked)

- **Core:** `RuntimeAdapters` (`node` / `web` / `edge`) — all project cache IO through ports; **no** `process.*` in `packages/core/src/**` except `runtime/node/system.ts` (`cwd`).
- **CLI:** owns `process`, `os.homedir`, update check, `rg` spawn, default cache roots.
- **Hosts must pass** `createNodeRuntimeAdapters()` for native desktop CLI — not `webPathRuntime`.

---

## Done when

- Windows (and optionally macOS) CI smoke is green on `main`.
- All three disk surfaces documented with **actual paths** per OS.
- Known risks (symlinks, project-id hash, archive env) fixed or explicitly accepted with issue codes / docs.
- No new POSIX-only shell dependencies in CLI core path.
