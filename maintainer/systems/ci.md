# CI systems — maintainer map

**Audience:** Maintainers and agents changing GitHub Actions, Vitest CI reporters, or debug artifacts.  
**Sequencing / tracker:** [`maintainer/phases/ci.md`](../phases/ci.md) · **Platform matrix (product):** [`platform.md`](./platform.md) · **Knip/madge remediation:** [`health.md`](./health.md)

**Update this page when workflow structure changes** (job DAG, matrix, artifacts, reporters, or new workflows).

---

## Workflows

| File | Role | Merge gate |
|------|------|------------|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | PR + push: typecheck → cli-build → test → parity | **Required** |
| [`.github/workflows/architecture.yml`](../../.github/workflows/architecture.yml) | Nightly + manual: knip, madge | **Non-blocking** |

---

## Job DAG (`ci.yml`)

```text
typecheck (ubuntu-only)
    ↓ needs
cli-build (ubuntu | windows | macos)  → upload cli-dist-<os> (1 day, job handoff)
    ↓ needs
test (same 3 OS)                      → download cli-dist-<os>; pnpm test
    ↓ needs
parity (same 3 OS)                    → download cli-dist-<os>; pnpm vitest run tests/parity
```

| Job | Matrix | Timeout | Notes |
|-----|--------|---------|--------|
| **typecheck** | `ubuntu-latest` only | 30m | Fast TS + `ui:purity` via `pnpm typecheck` |
| **cli-build** | 3 OS, `fail-fast: false` | ubuntu 30m · win/mac 45m | `pnpm cli:build`; uploads `dist/` per OS |
| **test** | 3 OS, `fail-fast: false` | same | Reuses built CLI; no second `cli:build` |
| **parity** | 3 OS, `fail-fast: false` | same | `tests/parity` only |

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
| **pnpm** | 10 (`pnpm/action-setup@v4`) |
| **Install** | `pnpm install --frozen-lockfile` |

---

## Per-OS `cli-dist` artifacts (job handoff)

After **`cli-build`**, each matrix leg uploads:

| Property | Value |
|----------|--------|
| **Name** | `cli-dist-${{ matrix.os }}` |
| **Path** | `dist/` (repo root — output of `pnpm cli:build` / tsup) |
| **Retention** | 1 day (ephemeral; for `test` / `parity` download only) |

`test` and `parity` use `actions/download-artifact@v4` with the matching OS name before running gates.

---

## CI-2 — PR test annotations

**Reporter:** Vitest **built-in** [`github-actions`](https://vitest.dev/guide/reporters#github-actions-reporter) (Vitest ≥ 1.3). No third-party `vitest-github-actions-reporter` package.

**Gating** (`vitest.config.ts`):

- **PR CI:** `GITHUB_ACTIONS=true` and `GITHUB_EVENT_NAME=pull_request` → `reporters: ['default', 'github-actions']` (inline failure annotations + job summary).
- **Push CI (`main`):** explicit `reporters: ['default']` so annotations are not auto-enabled on every push.
- **Local:** reporters unset → default Vitest behavior unchanged.

**Scope:** Applies to `pnpm test` in the **`test`** job only (not the separate **`parity`** job). Parity failures remain visible in job logs.

---

## CI-3 — Architecture nightly

Workflow: [`.github/workflows/architecture.yml`](../../.github/workflows/architecture.yml)

| Trigger | Detail |
|---------|--------|
| **`schedule`** | Daily (UTC cron in workflow file) |
| **`workflow_dispatch`** | Manual triage |

Steps: `pnpm install --frozen-lockfile` → `pnpm knip` → `pnpm madge:circular` → `pnpm madge:orphans`.

Each step uses **`continue-on-error: true`** — findings are visible in Actions but **do not block PR merge**. Remediation: [`health.md`](./health.md).

---

## CI-4 — Debug CLI dist artifacts

Separate from the 1-day handoff artifact:

| Property | Value |
|----------|--------|
| **When** | After **`cli-build`**: `windows-latest` **or** `failure()` on any OS |
| **Name** | `cli-dist-debug-${{ matrix.os }}` |
| **Path** | `dist/` |
| **Retention** | 7 days |

Use the Artifacts tab on failed Windows builds (or any failed `cli-build`) to download `dist/` for local repro without rebuilding on a VM.

---

## CI-5 — Change detection (deferred)

Path filters (`dorny/paths-filter`) or turborepo `--filter` so docs-only PRs skip the full matrix — **not v1**. Until CI-5 ships, **every PR runs the full matrix** (current behavior).

---

## Platform-gated tests (not skipped in CI)

[`tests/integration/spacesInPath.win32.test.ts`](../../tests/integration/spacesInPath.win32.test.ts) uses `describe.skip` on non-`win32` hosts — **passes as no-op** on ubuntu/macOS matrix rows; runs on `windows-latest`. This is a **test-level gate**, not a workflow skip.

---

## Related

- [`maintainer/phases/ci.md`](../phases/ci.md) — session tracker and commit discipline
- [`platform.md`](./platform.md) — OS support promise and path policy
- [`health.md`](./health.md) — knip / madge scripts and when to run locally
- [`shipped-slices.md`](../phases/shipped-slices.md) — close phase rows when slices land
