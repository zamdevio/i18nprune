# Platform support (CLI + SDK)

**Audience:** Maintainers and agents — how i18nprune runs on **Windows, macOS, native Linux, and WSL** without POSIX-only assumptions in **core**.  
**User docs:** [`docs/cli/cache.md`](../../docs/cli/cache.md) (paths, WSL, home layout) · [`docs/config/env.md`](../../docs/config/env.md) (`I18NPRUNE_HOME`) · [`docs/issues/paths.md`](../../docs/issues/paths.md) (readiness warnings)

**Lifecycle:** `stable` (v1) · **Last reviewed:** 2026-06-01 (XP program shipped; this page is the durable map)

---

## Promise

With **Node ≥ 18**, the **CLI** and **`@i18nprune/core` SDK** run the same local workflows on all three **CI OS families** — project scan, **all disk caches**, locale IO, and desktop **`i18nprune report`** — using Node **`path.join`** and **runtime adapters**, not shell-specific tools or hardcoded `/` in core cache/locale IO.

**Release gate:** `.github/workflows/ci.yml` — one `verify` job, matrix `ubuntu-latest` | `windows-latest` | `macos-latest`, `fail-fast: false` (install → `pnpm typecheck` → `pnpm cli:build` → `pnpm test` → `pnpm vitest run tests/parity`).

---

## Supported runtimes

| Runtime | CLI + SDK | Notes |
|---------|-----------|--------|
| **Native Linux** | Supported | Primary dev + `ubuntu-latest` CI |
| **macOS** | Supported | `macos-latest` CI; NFC-normalized cache project id (see below) |
| **Windows** (CMD, PowerShell, Terminal) | Supported | `windows-latest` CI; optional `rg` / `rg.exe` on PATH for cleanup quality |
| **WSL** (Node inside distro) | Supported | `process.platform: linux`; paths are Linux paths inside the distro |
| **Windows native ↔ WSL same repo** | **Out of promise** | Different path namespaces → different cache `projectId` folders |

Use one Node environment per checkout for day-to-day work and CI parity.

---

## SDK boundaries (locked)

| Layer | Owns | Must not |
|-------|------|----------|
| **Core** | `RuntimeAdapters` (`node` / `web` / `edge`); all project cache IO via ports | `console.*`, `process.*` (except `runtime/node/system.ts` `cwd`), direct `fs` |
| **CLI** | `process`, `os.homedir`, update check, `rg` spawn, default `<home>` roots | Business logic that belongs in `runXxx` |
| **Desktop CLI host** | Pass **`createNodeRuntimeAdapters()`** | Do not use **`webPathRuntime`** for native scan/cache |

**Browser / worker hosts** use `webPathRuntime` or `edgePathRuntime` only for zip/archive ingest — not for local project scan + disk cache on a developer machine.

---

## Path policy

| Rule | Where |
|------|--------|
| **Disk paths** | `runtime.path.join` only — no hardcoded `/` in cache, locale read/write, translate L2 (`translations/<code>.json`) |
| **Logical API output** | `toPosixPath` for locale lists, segment paths, missing-key `file` lines — JSON/logs use `/` even on Windows |
| **Archive zip keys** | `path.relative` + posix display (`project/prepare/archiveFs.ts`) |
| **Source walk** | Symlink cycle guard + depth cap (`shared/scanner/files.ts`; `realpath` on Node when available) |
| **Atomic cache writes** | Temp file + `rename` same directory (`packages/cli/src/shared/cache/runtime.ts`) — NTFS-safe pattern |

**Path helpers barrel:** `packages/core/src/shared/path/index.js` (`toPosixPath`, `collectPlatformPathWarnings`, …) — do not import `posix.ts` / `platform.ts` directly.

---

## CLI home (three disk surfaces)

Do not conflate these; see also [`cache.md`](./cache.md).

| Surface | Default path | Owner | Purpose |
|---------|--------------|-------|---------|
| **Project + analysis + translate cache** | `<home>/cache/projects/<id>/` | Core policy + CLI default root | `meta.json`, `files.json`, `analysis.json`, `translations/<code>.json` |
| **Version throttle** | `<home>/state/version.json` | **CLI only** | npm registry check interval — core never reads this |
| **Project cache id** | 16-char hex under `projects/` | Core `cache/io/hash.ts` | Hash of **normalized** (lowercase, posix) project root |

**`<home>`:** `~/.i18nprune` or `%USERPROFILE%\.i18nprune` — override entire tree with **`I18NPRUNE_HOME`** (CLI prints `[info]` when set).

| OS | `<home>` |
|----|----------|
| Linux / macOS | `~/.i18nprune/` |
| Windows native | `%USERPROFILE%\.i18nprune\` |
| WSL | Linux home inside distro (not Windows profile path) |

**Code map (quick)**

| Concern | Entry |
|---------|--------|
| Home resolution | `packages/cli/src/shared/home/resolve.ts` |
| Version state | `packages/cli/src/utils/update/cache.ts` |
| CLI cache runtime | `packages/cli/src/shared/cache/runtime.ts`, `paths.ts` |
| Core cache paths | `packages/core/src/cache/setup/paths.ts` |
| Translate L2 paths | `packages/core/src/translator/cache/paths.ts` |
| Project id hash | `packages/core/src/cache/io/hash.ts` |

---

## Known limits (handled, not “bugs”)

Readiness may emit **non-fatal** path issues before heavy work (`runProjectReadiness` → `collectPlatformPathWarnings`):

| Limit | Issue code | Severity |
|-------|------------|----------|
| Windows reserved segment (`CON`, `NUL`, `COM1`, …) | `i18nprune.paths.windows_reserved_name` | `warning` |
| Very long Windows paths (≥ ~240 chars) | `i18nprune.paths.windows_long_path` | `warning` |
| UNC `\\server\share\...` | `i18nprune.paths.network_drive` | `info` |
| macOS NFD vs NFC spelling | Cache id uses NFC before hash | (no issue — stabilizes `projectId`) |
| Case-only path differences | Same cache id on case-insensitive FS | Documented in user cache docs |

Full copy: [`docs/issues/paths.md`](../../docs/issues/paths.md).

**Intentional v1 behavior (do not “fix” without design):**

- **Project id lowercasing** — stable on Windows; may differ from case-sensitive Linux checkouts.
- **Single CLI home tree** — not `%APPDATA%`; use `I18NPRUNE_HOME` to relocate.
- **No `\\?\` auto-prefix** for long paths — enable OS long-path support or shorten roots.

---

## Report environment metadata

| Source | Behavior |
|--------|----------|
| **CLI `i18nprune report`** | `buildReportEnvironmentSnapshot` — `process.platform`, `os.release()`, Linux distro from `/etc/os-release`, WSL via `WSL_DISTRO_NAME` (`packages/cli/src/commands/report/build.ts`) |
| **Archive / worker / web zip report** | `archiveHostedReportEnvironment` — `runtimeFamily: edge-worker`, hosted `platform` (`cloudflare-workers` or `browser`); not desktop scan env (`packages/core/src/report/archiveEnvironment.ts`) |

Report SPA editor links require real desktop `project.environment`; hosted zip reports correctly show **unsupported** for local editor open.

---

## CI and tests

| Check | Location |
|-------|----------|
| OS matrix | `.github/workflows/ci.yml` |
| Parity (frozen CLI contract) | `tests/parity/` — use `readParitySnapshot` for CRLF-safe reads on Windows |
| Spaces in project + home path | `tests/integration/spacesInPath.win32.test.ts` (runs on `windows-latest` only) |
| Win32 translate-cache paths | `packages/core/src/translator/cache/__tests__/` (`win32PathRuntime.ts`, `paths.test.ts`, …) |
| CLI home / version state | `packages/cli/src/shared/home/__tests__/`, `packages/cli/src/utils/update/__tests__/` |

Before merge: `pnpm typecheck` · `pnpm test` · `pnpm vitest run tests/parity` when CLI output changes.

---

## Manual smoke (Windows or any OS)

| Step | Command |
|------|---------|
| Node version | `node -v` (≥ 18) |
| Doctor | `i18nprune doctor` (note `rg` warn if missing) |
| Validate | `i18nprune validate --json` |
| Cache hit | Run twice; optional `--debug-cache` |
| Version file | Confirm `<home>/state/version.json` after a non-`--json` run |
| Report | `i18nprune report --format html` |

---

## Out of scope (other systems)

| Area | See |
|------|-----|
| Project cache policy (rebuild, profiles, L1/L2) | [`cache.md`](./cache.md) |
| Share / worker ingest | [`share.md`](./share.md) |
| Report SPA / editor matrix | `apps/report` |
| Extension host | [`phases/extension/README.md`](../phases/extension/README.md) |
| Health gates (knip, madge) | [`health.md`](./health.md) |

---

## Change discipline

Update this page when **platform contract** changes (adapter rules, home layout, matrix shape, new path issue codes). Slice history lived in the former cross-platform phase doc — **do not** recreate sprint checklists here.
