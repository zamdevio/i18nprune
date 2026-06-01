# CI hardening phase

**Status:** **Shipped** (CI-1–4; **CI-5 deferred** post-v1 — v1 Session CI in [`V1-RELEASE.md`](./V1-RELEASE.md))  
**Hub:** [`V1-RELEASE.md`](./V1-RELEASE.md) · **Sprint narrative:** [`active-phase.md`](./active-phase.md) · **After (shipped):** [`systems/platform.md`](../systems/platform.md) (OS matrix) · [`shipped-slices.md`](./shipped-slices.md) (tree T0–T10)

**Promise (one sentence):** GitHub Actions gives **fast, diagnosable PR feedback** (split gates, annotations, scoped artifacts) and **scheduled architecture hygiene** (knip/madge) without blocking v1 ship on deploy or monorepo tooling.

**PR discipline:** **one session per commit** (CI-1 … CI-5) unless a slice is trivially split; each session ends with green `main`-equivalent workflow on a PR. Gates: `pnpm typecheck` · `pnpm test` · `pnpm vitest run tests/parity` when CLI/contracts touched.

**Systems maps:** [`systems/ci.md`](../systems/ci.md) (workflow DAG, artifacts, reporters) · [`systems/health.md`](../systems/health.md) (knip/madge) · [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

---

## Baseline (CI-1 shipped)

Current [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — job DAG **`typecheck` → `cli-build` → `test` → `parity`** (see [`systems/ci.md`](../systems/ci.md)).

| Property | Value |
|----------|--------|
| **Triggers** | `push` to `main`/`master`, all `pull_request` |
| **Concurrency** | `ci-${{ workflow }}-${{ ref }}`, `cancel-in-progress: true` |
| **Matrix** | `typecheck`: ubuntu-only; other jobs: ubuntu (30m) · windows (45m) · macos (45m) |
| **Strategy** | `fail-fast: false` on matrix jobs — one OS failure does not cancel siblings |
| **Toolchain** | Node **22**, pnpm **10**, `pnpm install --frozen-lockfile` |
| **Handoff** | Per-OS `cli-dist-<os>` artifact (`dist/`, 1 day) between jobs |

XP-1 shipped the 3-OS matrix; CI-1 split the monolithic **`verify`** job without changing product contracts.

---

## Sessions

| Session | Slices | Goal |
|---------|--------|------|
| **CI-1** | Split `verify` | Parallel jobs + `needs:` DAG; document OS matrix placement |
| **CI-2** | PR annotations | Surface Vitest failures on PR diffs |
| **CI-3** | Architecture nightly | Scheduled knip + madge (non-blocking) |
| **CI-4** | Build artifacts | Upload CLI dist for Windows/debug failures |
| **CI-5** | Change detection | Path filters / turborepo — **later** (planned, not v1 blocker) |

---

## Tracker

| # | Slice | Status | Notes |
|---|-------|--------|-------|
| **CI-1** | Split verify job | **Shipped** | typecheck · cli:build · test · parity as separate jobs |
| **CI-2** | PR test annotations | **Shipped** | Vitest built-in `github-actions` reporter; PR `pull_request` only (`vitest.config.ts`) |
| **CI-3** | Architecture nightly | **Shipped** | `.github/workflows/architecture.yml` — schedule + `workflow_dispatch`; non-blocking steps |
| **CI-4** | Build artifacts | **Shipped** | `cli-dist-debug-<os>` from `cli-build`: 7-day retention; windows + `failure()` |
| **CI-5** | Change detection | **Deferred** | paths-filter / turborepo — post-v1 unless trivial |

---

## Slice detail

### CI-1 — Split verify job

**Scope**

- Replace monolithic `verify` with jobs: **`typecheck`**, **`cli-build`**, **`test`**, **`parity`**.
- Wire **`needs:`** so install-heavy work runs once per OS where needed (shared setup job or duplicate install per job — document choice in workflow comments).
- **Matrix policy (document in workflow):**
  - **Option A (recommended):** `test` + `parity` on **3 OS**; `typecheck` on **ubuntu-only** (fast signal); `cli-build` on **ubuntu + windows** (Win path cases).
  - **Option B:** Full 3×OS only on `test`; everything else ubuntu-only.
- Keep **`fail-fast: false`** on matrix legs that remain.
- Preserve: concurrency cancel, Node 22, pnpm 10 frozen lockfile, same script names.

**Acceptance**

- PR shows separate job badges per gate; failed step identifiable without scrolling one log.
- Green PR requires same effective gates as today (typecheck, cli:build, test, parity).
- Workflow comment block states matrix rationale.

**Gates**

- No change to parity bytes or exit codes from this slice alone.
- `pnpm typecheck` · `pnpm test` · parity still pass locally.

**Shipped (matrix):** `typecheck` on **ubuntu-only**; `cli-build` → `test` → `parity` each on **ubuntu + windows + macos** (`fail-fast: false`). macOS stays in `cli-build` (not only ubuntu+windows) because downstream legs need `dist/` on every runner — passed via per-OS `upload-artifact` / `download-artifact` between jobs.

---

### CI-2 — PR annotations

**Scope**

- Research and adopt one path:
  - **Vitest:** `vitest-github-actions-reporter` (or official Vitest action annotations if stable), **or**
  - **JUnit:** `reporter: 'junit'` + `actions/upload-artifact` + third-party annotate action.
- Limit to **PR** workflows (not required on every push to `main` if noisy).
- Annotate **failed tests** with file/line; do not change test assertions.

**Acceptance**

- A deliberately failing test on a PR shows inline annotation (or checklist comment linking to job + file).
- Document reporter choice in [`systems/ci.md`](../systems/ci.md) § CI-2.

**Gates**

- Reporter must not alter test discovery or shuffle parity paths.
- `pnpm test` unchanged locally.

---

### CI-3 — Architecture nightly

**Scope**

- New workflow (e.g. `.github/workflows/architecture.yml`) on **`schedule`** (nightly) + optional `workflow_dispatch`.
- Steps: `pnpm install --frozen-lockfile` → `pnpm knip` → `pnpm madge:circular` → `pnpm madge:orphans`.
- **Non-blocking for v1:** `continue-on-error: true` per step **or** separate workflow that does not gate merge (document choice).
- Link failures to [`systems/health.md`](../systems/health.md) remediation.

**Acceptance**

- Scheduled run appears in Actions tab; failures visible but **do not block** PR merge.
- README in workflow header explains maintainer triage expectation.

**Gates**

- No edits to `knip.json` / madge scope unless a slice explicitly fixes a finding.

---

### CI-4 — Build artifacts

**Scope**

- After `pnpm cli:build`, **`actions/upload-artifact`** for `packages/cli/dist/**` (or documented subset).
- Trigger on **failure** and/or **windows-latest** only to limit storage — document retention (`retention-days: 7`).
- Optional: upload Vitest report from CI-2 on failure.

**Acceptance**

- Failed Windows `cli-build` or `test` job offers downloadable dist (or build log bundle) from Artifacts tab.
- Artifact size stays bounded (no `node_modules`, no full monorepo).

**Gates**

- Artifacts are debug-only; not a release publish channel.

---

### CI-5 — Change detection (deferred / experimental)

**Scope (planned, not v1-blocking)**

- Path-based filters (`dorny/paths-filter` or equivalent) or turborepo `--filter` so docs-only PRs skip full matrix.
- Rationale deferred: needs careful mapping of `docs/**`, `apps/docs/**`, `packages/*`, parity fixtures; wrong filters silently skip real gates.

**Acceptance (when picked up)**

- Documented path → job map in workflow; at least one integration test PR proves filter correctness.

**Gates**

- Default until CI-5 ships: **full matrix on every PR** (current behavior).

---

## Recommended order

1. **CI-1** — unlocks faster feedback and cleaner logs for later slices.  
2. **CI-2** — improves PR UX while touching workflow anyway.  
3. **CI-4** — pairs with Windows matrix from CI-1.  
4. **CI-3** — independent nightly; low merge conflict risk.  
5. **CI-5** — post-v1 or explicit experimental PR.

---

## Commit discipline

| Rule | Detail |
|------|--------|
| **Granularity** | **One commit per session** (CI-1, CI-2, …) unless user asks per-slice commits |
| **Message** | `ci(CI-n): <short outcome>` |
| **Do not bundle** | Product behavior, docs refactor, or knip baseline fixes unrelated to the session |

---

## Deferred (not in v1 CI phase)

| Item | Why |
|------|-----|
| **Auto deploy** Cloudflare Workers/Pages (docs, landing, web, workers) | Pre-v1 skip — manual/preview deploy sufficient |
| **Turborepo / Nx** full adoption | Large repo churn; only if CI-5 justifies it |
| **Required knip/madge on every PR** | Use CI-3 nightly + local [`systems/health.md`](../systems/health.md) until baseline clean |

---

## Related

- [`systems/ci.md`](../systems/ci.md) — **canonical** workflow DAG, artifacts, reporters (update when `ci.yml` changes)
- [`systems/platform.md`](../systems/platform.md) — OS matrix (shipped)
- [`shipped-slices.md`](./shipped-slices.md) — close CI rows here when done
- [`docs-refactor.md`](./docs-refactor.md) — docs phase (parallel priority 4)
- [`final.md`](./final.md) — release gate still runs full CI smoke
