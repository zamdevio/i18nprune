# CI systems — maintainer map

**Audience:** Maintainers and agents changing GitHub Actions, Vitest CI reporters, or debug artifacts.  
**Receipt:** [`shipped-slices.md`](../phases/shipped-slices.md) (CI-1–5) · **Platform matrix (product):** [`platform.md`](./platform.md) · **Knip/madge remediation:** [`health.md`](./health.md)

**Update this page when workflow structure changes** (job DAG, matrix, artifacts, reporters, or new workflows).

**Workflow source comments:** use plain descriptive headers in `.github/workflows/*`, `vitest.config.ts`, and other non-maintainer files. Phase slice IDs (**CI-1**, **CI-2**, …) belong in this map and [`shipped-slices.md`](../phases/shipped-slices.md) only — not `(CI-n)` tags in workflow YAML or config.

---

## Workflows

| File | Role | Merge gate |
|------|------|------------|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | PR + push: typecheck → cli-build → test → parity | **Required** |
| [`.github/workflows/architecture.yml`](../../.github/workflows/architecture.yml) | Nightly + manual: knip, madge | **Non-blocking** |

---

## Job DAG (`ci.yml`)

```text
scope (ubuntu-only)  → outputs: docs_only, run_product, turbo_filter, run_ui_purity
    ↓ needs
typecheck (ubuntu-only)               → turbo affected typecheck (+ //#ui:purity when scoped)
    ↓ needs
cli-build (ubuntu | windows | macos)  → if run_product; turbo //#cli:build; upload cli-dist-<os>
    ↓ needs
test (same 3 OS)                      → if run_product; download cli-dist-<os>; turbo //#test
    ↓ needs
parity (same 3 OS)                    → if run_product; download cli-dist-<os>; turbo //#parity
```

| Job | Matrix | Timeout | Notes |
|-----|--------|---------|--------|
| **scope** | `ubuntu-latest` only | 5m | Path guards + turbo filter for downstream jobs |
| **typecheck** | `ubuntu-latest` only | 30m | `pnpm turbo run typecheck` (affected or full); `//#ui:purity` when scoped |
| **cli-build** | 3 OS, `fail-fast: false` | ubuntu 30m · win/mac 45m | Skipped when `docs_only`; else `pnpm turbo run //#cli:build` |
| **test** | 3 OS, `fail-fast: false` | same | Skipped when `docs_only`; `pnpm turbo run //#test` |
| **parity** | 3 OS, `fail-fast: false` | same | Skipped when `docs_only`; `pnpm turbo run //#parity` |

**Why macOS is in `cli-build`:** `test` and `parity` run on every matrix leg and expect `dist/cli.js` on that runner — not rebuilt per job.

---

## Triggers and concurrency

| Event | Branches / scope |
|-------|------------------|
| **`push`** | `main`, `master` |
| **`pull_request`** | all branches |

```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

New commits on the same ref cancel in-flight runs.

---

## Toolchain (all CI jobs)

| Tool | Version |
|------|---------|
| **Node** | 22 (`actions/setup-node@v4`) |
| **pnpm** | `packageManager` in root `package.json` (`pnpm/action-setup@v4`, no `version:` pin) |
| **Install** | `pnpm install --frozen-lockfile` |

---

## Per-OS `cli-dist` artifacts (job handoff)

After **`cli-build`**, each matrix leg uploads:

| Property | Value |
|----------|--------|
| **Name** | `cli-dist-${{ matrix.os }}` |
| **Path** | `dist/` (repo root — output of `pnpm cli:build` / tsup) |
| **Retention** | 1 day (ephemeral; for `test` / `parity` download only) |

`test` and `parity` use `actions/download-artifact@v4` with the matching OS name and **`path: dist`** before running gates.

**Why `path: dist`:** `upload-artifact` with `path: dist/` stores **`cli.js` at the artifact root**, not `dist/cli.js`. Downloading to the workspace default drops files next to `package.json`; Vitest and parity tests spawn **`dist/cli.js`**. An **Ensure CLI dist** step rebuilds via `//#cli:build` only when `dist/cli.js` / `dist/core.js` are still missing after download.

---

## CI-2 — PR test annotations (shipped)

**Reporter:** Vitest **built-in** [`github-actions`](https://vitest.dev/guide/reporters#github-actions-reporter) (Vitest ≥ 1.3). No third-party `vitest-github-actions-reporter` package.

**Gating** (`vitest.config.ts`):

- **PR CI:** `GITHUB_ACTIONS=true` and `GITHUB_EVENT_NAME=pull_request` → `reporters: ['default', 'github-actions']` (inline failure annotations + job summary).
- **Push CI (`main`):** explicit `reporters: ['default']` so annotations are not auto-enabled on every push.
- **Local:** reporters unset → default Vitest behavior unchanged.

**Scope:** Applies to `pnpm test` in the **`test`** job only (not the separate **`parity`** job). Parity failures remain visible in job logs.

---

## CI-3 — Architecture nightly (shipped)

Workflow: [`.github/workflows/architecture.yml`](../../.github/workflows/architecture.yml)

| Trigger | Detail |
|---------|--------|
| **`schedule`** | Daily (UTC cron in workflow file) |
| **`workflow_dispatch`** | Manual triage |

Steps: `pnpm install --frozen-lockfile` → `pnpm knip` → `pnpm madge:circular` → `pnpm madge:orphans`.

Each step uses **`continue-on-error: true`** — findings are visible in Actions but **do not block PR merge**. Remediation: [`health.md`](./health.md).

---

## CI-4 — Debug CLI dist artifacts (shipped)

Separate from the 1-day handoff artifact:

| Property | Value |
|----------|--------|
| **When** | After **`cli-build`**: `windows-latest` **or** `failure()` on any OS |
| **Name** | `cli-dist-debug-${{ matrix.os }}` |
| **Path** | `dist/` |
| **Retention** | 7 days |

Use the Artifacts tab on failed Windows builds (or any failed `cli-build`) to download `dist/` for local repro without rebuilding on a VM.

---

## Turborepo (change detection)

**Config:** [`turbo.json`](../../turbo.json) · **CLI:** `turbo` devDependency at repo root · **`packageManager`:** `pnpm@10.33.0`

### Tasks (`turbo.json`)

| Task | Where | Role |
|------|--------|------|
| **`typecheck`** | Workspace packages with a `typecheck` script | `dependsOn: ["^typecheck"]` — upstream types first |
| **`//#ui:purity`** | Repo root (`//`) | `scripts/ui/purity-check.mjs`; runs after `@i18nprune/ui#typecheck` |
| **`//#cli:build`** | Repo root | `tsup` + report bundle → `dist/` (CI product gate) |
| **`//#test`** | Repo root | `vitest run` (full suite; not per-package) |
| **`//#parity`** | Repo root | `vitest run tests/parity` |
| **`build`** | Apps that ship `build` (Vite, VitePress, …) | Cached outputs under `dist/` / `.vitepress/dist/` |

Root **`pnpm typecheck`** → `turbo run typecheck //#ui:purity`. Root **`pnpm test`** / **`pnpm parity`** stay direct **`vitest`** for local ergonomics; CI uses **`//#test`** / **`//#parity`**.

### CI scope rules (`scope` job)

| Condition | `typecheck` | `cli-build` / `test` / `parity` |
|-----------|-------------|-----------------------------------|
| Push to **`main`/`master`** | Full (`turbo_filter=*`) | Full 3-OS matrix |
| **`full_pipeline`** paths (lockfile, `.github/**`, `turbo.json`, `tests/parity/**`, `tests/fixtures/**`, root toolchain) | Full | Full |
| **Docs-only** (`docs/**`, `apps/docs/**` without product paths) | `--filter=@i18nprune/docs` | **Skipped** |
| Other **PR** (product paths) | `--filter=[base...HEAD]` | Full product matrix (`run_product=true`) |

**`fetch-depth: 0`** on checkout in **`scope`** and **`typecheck`** so `[base...HEAD]` resolves. **`actions/cache`** on **`.turbo/`** (keyed by lockfile + `turbo.json`).

### Root scripts vs workspace packages

Root convenience scripts delegate to workspace packages via **`pnpm --filter <packageName> <script>`** when the package is in `pnpm-workspace.yaml`, has a **`name`**, and defines that script (see root `package.json`). Avoid **`pnpm --dir`** for those cases.

| Root script | Workspace package · script |
|-------------|---------------------------|
| **`cli:typecheck`** | `@i18nprune/cli` · `typecheck` (root `tsconfig.json` compile unit) |
| **`core:typecheck`**, **`ui:typecheck`**, **`web:typecheck`**, **`docs:*`**, **`landing:*`**, **`meta:*`**, **`worker:*`**, **`report:typecheck`** | matching `@i18nprune/*` · `typecheck` / `dev` / `build` / … |
| **`docs:sync`** | `@i18nprune/docs` · `sync` |
| **`report:dev`**, **`report:build`** | `@i18nprune/report` · `dev` / `build` |
| **`ext:compile`**, **`ext:watch`**, **`ext:build`** | `@i18nprune/extension` · same script name |
| **`ext:web:dev`**, **`ext:web:build`**, **`ext:web:typecheck`** | `@i18nprune/extension-webview` · `dev` / `build` / `typecheck` |
| **`ext:typecheck`** | `@i18nprune/extension` · `typecheck:host` (host has no turbo **`typecheck`**; webview is separate) |

**Root-only** (no workspace delegate): **`cli:build`**, **`//#cli:build`**, **`cli:dev`**, **`test`** / **`parity`** / **`//#test`** / **`//#parity`**, **`generate:languages`**, **`ui:purity`** / **`//#ui:purity`**, **`ui:sync:*`**, **`knip`**, **`madge:*`**, **`empty:*`**, **`files`** / **`lines`** / **`stats`**. Deploy helpers chain **`pnpm *:build`** then **wrangler** from repo root (paths in argv; not `--filter`).

**`pnpm typecheck`** runs **`turbo run typecheck //#ui:purity`** on workspace packages that define a **`typecheck`** script (not the extension host alias).

### Local commands

```bash
pnpm typecheck                              # full workspace typecheck + ui:purity
pnpm turbo run typecheck --filter=@i18nprune/core...
pnpm turbo run typecheck --filter=@i18nprune/docs
pnpm turbo run //#cli:build
pnpm cli:typecheck                          # @i18nprune/cli only
pnpm ext:typecheck                          # extension host only
```

Workspace rename for turbo uniqueness: **`packages/cli`** → **`@i18nprune/cli`** (was duplicate `i18nprune` name with root + extension).

---

## Platform-gated tests (not skipped in CI)

[`tests/integration/spacesInPath.win32.test.ts`](../../tests/integration/spacesInPath.win32.test.ts) uses `describe.skip` on non-`win32` hosts — **passes as no-op** on ubuntu/macOS matrix rows; runs on `windows-latest`. This is a **test-level gate**, not a workflow skip.

---

## Related

- [`shipped-slices.md`](../phases/shipped-slices.md) — CI-1–5 shipped receipt
- [`platform.md`](./platform.md) — OS support promise and path policy
- [`health.md`](./health.md) — knip / madge scripts and when to run locally
- [`shipped-slices.md`](../phases/shipped-slices.md) — close phase rows when slices land
