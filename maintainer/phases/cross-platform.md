# Cross-platform hardening (CLI + SDK)

**Status:** **In progress** — **XP-0…2b** shipped (matrix CI green on `main`); **XP-3** in flight — **XP-4…7** open.  
**Hub:** [`V1-RELEASE.md`](./V1-RELEASE.md) · **Active narrative:** [`active-phase.md`](./active-phase.md) · **Then:** [`tree.md`](./tree.md)

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

## XP-0 audit receipt (2026-06-01)

Code review of CLI + core paths relevant to Win/macOS/Linux/WSL. **No runtime changes in XP-0** — findings drive XP-1…XP-7.

### Verdict

| Area | Result |
|------|--------|
| **Path IO in core** | Uses `RuntimePathPort` / `path.join` — no hardcoded `/` in cache or locale IO |
| **CLI home + cache** | `I18NPRUNE_HOME` or `~/.i18nprune` — `<home>/cache` + `<home>/state/version.json` on Windows under `%USERPROFILE%\.i18nprune\` |
| **Atomic cache writes** | `writeTextAtomic`: `mkdirSync` → temp file → `renameSync` same directory (`packages/cli/src/shared/cache/runtime.ts`) — standard Node pattern on NTFS |
| **Project cache id** | `normalizeProjectRoot` lowercases + forward-slash canonical form (`packages/core/src/cache/io/hash.ts`) — stable on case-insensitive FS; may differ from Linux case-sensitive checkout ids |
| **Report env (CLI)** | `buildReportEnvironmentSnapshot` uses `process.platform`, `os.release()`, WSL via `WSL_DISTRO_NAME` (`packages/cli/src/commands/report/build.ts`) |
| **Report env (archive)** | `prepareReportFromArchive` uses placeholder `environment` (`platform: 'archive-hosted'`, empty `osRelease`) — **XP-5** |
| **Source walk** | **Mitigated (XP-2)** — `listSourceFiles` uses `realpath` + depth cap; Node `listDir` follows symlink-to-dir entries |
| **Optional `rg`** | `spawnSync('rg', …)` — needs `rg` / `rg.exe` on PATH; doctor warns when missing |
| **Shell deps** | No `rm`/`cp` on main CLI path; `fs.rmSync` in cache runtime |
| **CI** | Single `verify` job — matrix `ubuntu-latest` \| `windows-latest` \| `macos-latest` (`.github/workflows/ci.yml`) |

### Path reference (user-facing copy in `docs/cli/cache.md`)

| Surface | Linux / macOS | Windows (native Node) | WSL |
|---------|---------------|------------------------|-----|
| Project cache | `~/.i18nprune/cache/` | `%USERPROFILE%\.i18nprune\cache\` | Linux paths inside distro |
| Version throttle | `<home>/state/version.json` (default `~/.i18nprune/`) | `%USERPROFILE%\.i18nprune\state\version.json` | Same as Linux |
| Share local | `…/projects/<id>/share.json` | Same layout under project cache dir | Same as Linux |

**Out of promise:** sharing cache dirs or project roots between **Windows native** and **WSL** Node — different path namespaces.

### Accepted for v1 (document, do not “fix” blindly)

- **Project id lowercasing** — intentional; document in XP-2.
- **Single CLI home tree** — version throttle at `<home>/state/version.json` (not `%APPDATA%`); override with **`I18NPRUNE_HOME`** (XP-3).
- **Archive report placeholder env** — fix in XP-5, not a scan failure.

### Known limits — handlers (XP-2b)

| Limit | Handler | Notes |
|-------|---------|--------|
| **Unicode NFC/NFD (macOS)** | `normalizePathKeyForCache` (NFC) in `cache/io/hash.ts` + meta index key | Stabilizes cache id when the same folder is spelled NFD on disk vs NFC elsewhere; does not rename on-disk files |
| **Windows reserved names** (`CON`, `NUL`, `COM1`, …) | `collectPlatformPathWarnings` → readiness `warning` (`i18nprune.paths.windows_reserved_name`) | Checks path segments under project roots |
| **Long paths (>~240 chars)** | readiness `warning` (`i18nprune.paths.windows_long_path`) | Does not auto-prefix `\\?\`; hosts may enable OS long-path support |
| **UNC / network shares** | readiness `info` (`i18nprune.paths.network_drive`) | Mapped drive letters (`Z:`) are not detected — document as operator risk |
| **Logical API paths** | `toPosixPath` on locale list / segment resolve / missing `file` lines | JSON and logs use `/` regardless of host `path.join` |

**macOS CI:** same matrix row as Windows; NFC cache normalization is the v1 filesystem-agnostic piece — full on-disk NFC rename is out of scope.

---

## Disk surfaces (all must be audited)

Three **CLI-owned** on-disk areas + **one core-owned** layout under a configurable root. Do **not** conflate them.

| Surface | Default location (CLI) | Owner | Purpose |
|---------|------------------------|-------|---------|
| **Version / update cache** | `<home>/state/version.json` (`I18NPRUNE_HOME` or `~/.i18nprune`) | **CLI only** (`packages/cli/src/shared/home/`, `utils/update/`) | npm registry throttle |
| **Project + analysis + translate cache** | `<home>/cache/` → `projects/<id>/` | **Core** policy + **CLI** default root (`packages/cli/src/shared/cache/`, `packages/core/src/cache/`) | `meta.json`, `files.json`, `analysis.json`, `translations/<code>.json` |
| **Per-project cache id** | Hash of normalized **project root** path | **Core** (`packages/core/src/cache/io/hash.ts`) | Stable `projects/<16-char-hex>/` segment |

**Code map — version cache**

| File | Role |
|------|------|
| `packages/cli/src/shared/home/resolve.ts` | `I18NPRUNE_HOME`, `<home>/cache`, `<home>/state/version.json` |
| `packages/cli/src/utils/update/cache.ts` | Read/write `version.json`; schema v1 |
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

**Important:** Core does **not** read `version.json`. Version cache is **CLI-only**. Cross-platform work must test **both** disk roots on Windows (`<home>/cache` and `<home>/state`).

---

## Current readiness (baseline)

| Runtime | CLI + SDK | Notes |
|---------|-----------|--------|
| **Native Linux** | **Likely works** | Primary CI (`ubuntu-latest`) |
| **WSL** | **Likely works** | Node `platform: linux`; paths are Linux inside distro |
| **macOS** | **CI-gated** | `macos-latest` matrix row |
| **Windows (CMD / PS / Terminal)** | **CI-gated** | `windows-latest` matrix row; optional `rg` on PATH |
| **Windows native vs WSL cross-host** | **Out of promise** | Do not assume paths cross boundaries |

**Confidence today:** **CI matrix on all three OS families** — phase closes when matrix is green on `main` and **XP-3…6** receipts land (see tracker).

---

## Hidden risks (prioritize in slices)

| Risk | Layer | Severity |
|------|-------|----------|
| **Matrix not green on `main`** | Repo | High — treat Win/macOS rows as release gate |
| **Cache project id lowercasing** | Core `cache/io/hash.ts` | Medium — correct on Windows FS; differs from Linux case-sensitive trees |
| **Symlink cycles in source walk** | Core `shared/scanner/files.ts` | Medium — all OSes |
| **Atomic cache write** (`tmp` + `rename` same dir) | CLI `buildCliCacheRuntime` | Low–medium — verify on Windows project cache dir |
| **`I18NPRUNE_HOME` override** | CLI `shared/home/` | Low — custom home must be writable; `[info]` line when set |
| **Archive report fake env** (`osRelease: '0'`) | Core `prepare/fromArchiveReport.ts` | UX/metadata — not runtime failure |
| **Optional `rg`** | CLI `utils/rg` | Medium for cleanup quality — `rg.exe` on PATH |
| **`webPathRuntime`** misuse | Core | Low if limited to browser/worker hosts |

---

## Tracker

| # | Slice | Status | Notes |
|---|-------|--------|-------|
| **XP-0** | Audit receipt + Windows checklist in this doc | **Shipped** | Receipt § below; user paths in [`docs/cli/cache.md`](../../docs/cli/cache.md) § OS paths |
| **XP-1** | CI OS matrix | **Shipped** | `.github/workflows/ci.yml` — one `verify` job, `fail-fast: false`, ubuntu 30m / win+mac 45m |
| **XP-2** | **Project cache** + path hygiene | **Shipped** | Matrix CI green; symlink guard + posix paths + archive FS |
| **XP-2b** | Known limits (handlers) | **Shipped** | `shared/path/platform.ts`; user docs table → **XP-6** |
| **XP-3** | **Version cache** (`state/version.json`) hardening | **Shipped** | `I18NPRUNE_HOME` + docs + CLI tests (`paths`, `cache.disk`, `skipPolicy`) |
| **XP-4** | **Translate cache** (`translations/*.json`) | **Todo** | Same `projectDir` as analysis; confirm L2 IO on Windows paths |
| **XP-5** | Report host metadata | **Todo** | Fix archive placeholder env; CLI `buildReportEnvironmentSnapshot` truth on all platforms |
| **XP-6** | User docs | **Todo** | `docs/cli/cache.md` — three disk surfaces, paths on Windows, WSL vs native Node |
| **XP-7** | Optional: spaces-in-path fixture test | **Todo** | One integration test on Windows CI |

---

## Slice detail

### XP-2 — Project cache (`~/.i18nprune/cache`)

- [x] Confirm project cache + tests on Windows — matrix CI green (`verify` windows-latest).
- [x] Document `config.cache.dir` override — [`docs/cli/cache.md`](../../docs/cli/cache.md) § OS paths.
- [x] `writeTextAtomic` exercised indirectly — project cache tests + parity pass on windows-latest.
- [x] Symlink cycle guard + depth cap in `listSourceFiles` (`packages/core/src/shared/scanner/files.ts`, optional `fs.realpath` on Node).
- [x] Document `computeCacheProjectId` lowercasing — [`docs/cli/cache.md`](../../docs/cli/cache.md) layout §.
- [x] NFC-normalize project root before cache id hash (`shared/path/platform.ts`).
- [x] Platform path warnings in `runProjectReadiness` (reserved / long / UNC).
- [x] `toPosixPath` for locale list + segment absolute paths + missing relative `file` lines.
- [x] Archive ingest FS uses `path.relative` (Windows-safe) — `project/prepare/archiveFs.ts`.

### XP-2b — Known limits (handlers)

- [x] Reserved segment detection (`CON`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`).
- [x] Long-path and UNC warnings via readiness (non-fatal).
- [ ] User docs table in `docs/cli/` (XP-6) — link issue codes when docs site lists them.

### XP-3 — Version cache (`state/version.json`)

- [x] Document home layout — [`docs/cli/cache.md`](../../docs/cli/cache.md) § Version throttle.
- [x] Disk round-trip tests — `packages/cli/src/utils/update/__tests__/cache.disk.test.ts` (`I18NPRUNE_HOME` temp dir).
- [x] Path resolution tests — `paths.test.ts` (default home + `I18NPRUNE_HOME`).
- [x] Skip policy tests — `skipPolicy.test.ts` (`CI`, `I18NPRUNE_NO_UPDATE_CHECK`).
- [x] **Do not** move version state into core — unchanged; CLI-owned.

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
| Version state file | after run: `<home>/state/version.json` exists (default under `~/.i18nprune/`) |
| Report HTML | `i18nprune report --format html` |
| Share (optional) | `i18nprune share upload` if worker configured |

---

## SDK boundaries (locked)

- **Core:** `RuntimeAdapters` (`node` / `web` / `edge`) — all project cache IO through ports; **no** `process.*` in `packages/core/src/**` except `runtime/node/system.ts` (`cwd`).
- **CLI:** owns `process`, `os.homedir`, update check, `rg` spawn, default cache roots.
- **Hosts must pass** `createNodeRuntimeAdapters()` for native desktop CLI — not `webPathRuntime`.

---

## CI shape (XP-1)

```yaml
verify:
  strategy.matrix: ubuntu-latest | windows-latest | macos-latest
  steps: install → typecheck → cli:build → test → vitest tests/parity
```

`fail-fast: false` is correct — one OS failure should not cancel the others.

---

## Done when

- All three matrix rows green on `main` (`pnpm typecheck`, `pnpm test`, parity).
- All three disk surfaces documented with **actual paths** per OS.
- Known risks (symlinks, project-id hash, archive env) fixed or explicitly accepted with issue codes / docs.
- No new POSIX-only shell dependencies in CLI core path.
